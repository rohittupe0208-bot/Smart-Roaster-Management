// ============================================================
// SMART ROSTER SCHEDULING ENGINE
// Constraint-based scheduling logic
// ============================================================

const Scheduler = (() => {

    // ---- DATE UTILITIES ----

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getMonthDates(year, month) {
        const days = getDaysInMonth(year, month);
        const dates = [];
        for (let d = 1; d <= days; d++) {
            dates.push(new Date(year, month, d));
        }
        return dates;
    }

    function isoDate(dateObj) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getDay(dateObj) {
        return dateObj.getDay(); // 0=Sun, 6=Sat
    }

    function isHoliday(dateStr, publicHolidays) {
        return publicHolidays.some(ph => ph.date === dateStr);
    }

    function isSunday(dateObj) {
        return getDay(dateObj) === 0;
    }

    // Determines if a brand-process rule requires work on a given date
    function isRequiredWorkDay(dateObj, workingRule, publicHolidays, workingDays = [], includeHolidays = false) {
        const ds = isoDate(dateObj);
        const holiday = isHoliday(ds, publicHolidays);
        const sunday = isSunday(dateObj);

        switch (workingRule) {
            case "365":
                return true; // always required
            case "no-holidays":
                return !holiday; // work even on Sundays, off on holidays
            case "no-sunday-holidays":
                return !holiday && !sunday; // off on Sundays and holidays
            case "custom-days":
                return Array.isArray(workingDays)
                    && workingDays.includes(getDay(dateObj))
                    && (includeHolidays || !holiday);
            default:
                return true;
        }
    }

    function getRequiredStaff(rule, dateObj) {
        return Number(rule.minStaffByDay?.[getDay(dateObj)]) || rule.minStaff;
    }

    function findAssignmentOverlaps(assignments, rulesByPair, employees, roster, date, publicHolidays) {
        const dayAssignments = assignments.filter(a => a.shiftStart && a.shiftEnd
            && rulesByPair.has(`${a.brandId}__${a.processId}`)
            && roster[a.empId]?.[date] === "work");
        const conflicts = [];
        const brandsById = new Map(DB.get("brands").map(brand => [brand.id, brand]));
        const processesById = new Map(DB.get("processes").map(process => [process.id, process]));

        for (let i = 0; i < dayAssignments.length; i++) {
            const first = dayAssignments[i];
            const firstRule = rulesByPair.get(`${first.brandId}__${first.processId}`);
            if (!firstRule) continue;
            const firstStart = first.shiftStart.split(":").reduce((h, m) => h * 60 + Number(m), 0);
            const firstEnd = first.shiftEnd.split(":").reduce((h, m) => h * 60 + Number(m), 0);
            if (!isRequiredWorkDay(new Date(`${date}T12:00:00`), firstRule.workingRule, publicHolidays, firstRule.workingDays, firstRule.includeHolidays)) continue;

            for (let j = i + 1; j < dayAssignments.length; j++) {
                const second = dayAssignments[j];
                if (first.empId !== second.empId) continue;
                const secondRule = rulesByPair.get(`${second.brandId}__${second.processId}`);
                if (!secondRule || !isRequiredWorkDay(new Date(`${date}T12:00:00`), secondRule.workingRule, publicHolidays, secondRule.workingDays, secondRule.includeHolidays)) continue;
                const secondStart = second.shiftStart.split(":").reduce((h, m) => h * 60 + Number(m), 0);
                const secondEnd = second.shiftEnd.split(":").reduce((h, m) => h * 60 + Number(m), 0);
                if (firstStart >= secondEnd || secondStart >= firstEnd) continue;

                const employee = employees.find(e => e.id === first.empId);
                const firstBrand = brandsById.get(first.brandId);
                const secondBrand = brandsById.get(second.brandId);
                const firstProcess = processesById.get(first.processId);
                const secondProcess = processesById.get(second.processId);
                conflicts.push({
                    type: "assignment-overlap",
                    date,
                    brandId: first.brandId,
                    processId: first.processId,
                    brandName: "Overlapping assignments",
                    processName: employee?.name || first.empId,
                    assignedEmployees: [first.empId],
                    severity: "high",
                    message: `${employee?.name || first.empId} is scheduled for overlapping shifts: ${firstBrand?.name || first.brandId} / ${firstProcess?.name || first.processId} (${first.shiftStart}-${first.shiftEnd}) and ${secondBrand?.name || second.brandId} / ${secondProcess?.name || second.processId} (${second.shiftStart}-${second.shiftEnd}).`,
                });
            }
        }

        return conflicts;
    }

    // ---- EMPLOYEE STATUS FOR A DAY ----

    // Returns status: 'work' | 'weekly-off' | 'leave' | 'comp-off' | 'holiday'
    function getEmployeeStatus(emp, dateObj, publicHolidays, leaves) {
        const ds = isoDate(dateObj);
        const dayOfWeek = getDay(dateObj); // 0=Sun

        // Check approved leaves/comp-offs first (higher priority than weekly off)
        const leave = leaves.find(l => l.empId === emp.id && l.date === ds && l.status === "approved");
        if (leave) {
            return leave.type === "CO" ? "comp-off" : "leave";
        }

        // Weekly off
        if (dayOfWeek === emp.weeklyOffDay) {
            return "weekly-off";
        }

        return "work";
    }

    // ---- ROSTER GENERATION ----

    function generateRoster(year, month) {
        const employees = DB.get("employees");
        const brands = DB.get("brands");
        const processes = DB.get("processes");
        const assignments = DB.get("assignments");
        const brandProcessRules = DB.get("brandProcessRules");
        const publicHolidays = DB.get("publicHolidays");
        const leaves = DB.get("leaves");

        const dates = getMonthDates(year, month);
        const roster = {}; // empId -> { date -> status }
        const coverage = {}; // brandId-processId -> date -> [empIds working]
        const conflicts = [];
        const assignmentsByPair = new Map();
        assignments.forEach(assignment => {
            const key = `${assignment.brandId}__${assignment.processId}`;
            if (!assignmentsByPair.has(key)) assignmentsByPair.set(key, []);
            assignmentsByPair.get(key).push(assignment);
        });

        // Initialize roster entries
        employees.forEach(emp => {
            roster[emp.id] = {};
            dates.forEach(d => {
                const ds = isoDate(d);
                roster[emp.id][ds] = getEmployeeStatus(emp, d, publicHolidays, leaves);
            });
        });

        // Build coverage map
        brandProcessRules.forEach(bpr => {
            const key = `${bpr.brandId}__${bpr.processId}`;
            const assignedEmps = assignmentsByPair.get(key) || [];
            coverage[key] = {};
            dates.forEach(d => {
                const ds = isoDate(d);
                const required = isRequiredWorkDay(d, bpr.workingRule, publicHolidays, bpr.workingDays, bpr.includeHolidays);
                if (!required) {
                    coverage[key][ds] = { required: false, working: [], conflict: false };
                    return;
                }

                // Find employees assigned to this brand+process
                const workingEmps = assignedEmps.filter(a => {
                    const empStatus = roster[a.empId] ? roster[a.empId][ds] : null;
                    return empStatus === "work";
                }).map(a => a.empId);

                const needed = getRequiredStaff(bpr, d);
                const hasConflict = workingEmps.length < needed;
                coverage[key][ds] = {
                    required: true,
                    working: workingEmps,
                    needed,
                    conflict: hasConflict,
                };

                if (hasConflict) {
                    const brand = brands.find(b => b.id === bpr.brandId);
                    const process = processes.find(p => p.id === bpr.processId);
                    const assignedNames = assignedEmps.map(a => {
                        const emp = employees.find(e => e.id === a.empId);
                        return emp ? emp.name : a.empId;
                    });
                    const offEmps = assignedEmps
                        .filter(a => roster[a.empId] && roster[a.empId][ds] !== "work")
                        .map(a => {
                            const emp = employees.find(e => e.id === a.empId);
                            const status = roster[a.empId][ds];
                            return emp ? `${emp.name} (${status})` : a.empId;
                        });

                    conflicts.push({
                        type: "coverage-gap",
                        date: ds,
                        brandId: bpr.brandId,
                        processId: bpr.processId,
                        brandName: brand ? brand.name : bpr.brandId,
                        processName: process ? process.name : bpr.processId,
                        required: needed,
                        available: workingEmps.length,
                        assignedEmployees: assignedNames,
                        offEmployees: offEmps,
                        severity: "critical",
                        message: `${brand?.name} - ${process?.name} needs ${needed} staff on ${ds} but only ${workingEmps.length} available. Unavailable: ${offEmps.join(", ")}`,
                    });
                }
            });
        });

        const rulesByPair = new Map(brandProcessRules.map(rule => [`${rule.brandId}__${rule.processId}`, rule]));
        dates.forEach(date => {
            conflicts.push(...findAssignmentOverlaps(assignments, rulesByPair, employees, roster, isoDate(date), publicHolidays));
        });

        return { roster, coverage, conflicts, year, month, generatedAt: new Date().toISOString() };
    }

    // ---- CONFLICT DETECTION ----

    function detectConflicts(rosterData) {
        const { roster, coverage } = rosterData;
        const conflicts = [];
        const brands = DB.get("brands");
        const processes = DB.get("processes");

        Object.keys(coverage).forEach(key => {
            const [brandId, processId] = key.split("__");
            const brand = brands.find(b => b.id === brandId);
            const process = processes.find(p => p.id === processId);

            Object.entries(coverage[key]).forEach(([date, info]) => {
                if (info.required && info.conflict) {
                    conflicts.push({
                        type: "coverage-gap",
                        date,
                        brandId,
                        processId,
                        brandName: brand?.name,
                        processName: process?.name,
                        required: info.needed,
                        available: info.working.length,
                        severity: "critical",
                        message: `${brand?.name} - ${process?.name} on ${date}: needs ${info.needed}, only ${info.working.length} available`,
                    });
                }
            });
        });

        const rules = DB.get("brandProcessRules");
        const rulesByPair = new Map(rules.map(rule => [`${rule.brandId}__${rule.processId}`, rule]));
        const dates = new Set(Object.values(coverage).flatMap(days => Object.keys(days)));
        const assignments = DB.get("assignments");
        const employees = DB.get("employees");
        const holidays = DB.get("publicHolidays");
        dates.forEach(date => {
            conflicts.push(...findAssignmentOverlaps(assignments, rulesByPair, employees, roster, date, holidays));
        });

        return conflicts;
    }

    // Revalidate a saved roster after changes
    function revalidateRoster(rosterKey) {
        const rosters = DB.getObj("rosters");
        if (!rosters[rosterKey]) return null;

        const [year, month] = rosterKey.split("-").map(Number);
        const freshData = generateRoster(year, month);

        // Merge manual overrides from saved roster
        const saved = rosters[rosterKey];
        const validStatuses = new Set(["work", "weekly-off", "leave", "comp-off"]);
        const validOverrides = {};
        if (saved.manualOverrides) {
            Object.entries(saved.manualOverrides).forEach(([empId, dates]) => {
                if (!freshData.roster[empId]) return;
                validOverrides[empId] = {};
                Object.entries(dates).forEach(([date, status]) => {
                    if (!(date in freshData.roster[empId]) || !validStatuses.has(status)) return;
                    freshData.roster[empId][date] = status;
                    validOverrides[empId][date] = status;
                });
                if (Object.keys(validOverrides[empId]).length === 0) delete validOverrides[empId];
            });
        }

        // Recompute coverage from merged roster
        const brandProcessRules = DB.get("brandProcessRules");
        const assignments = DB.get("assignments");
        const publicHolidays = DB.get("publicHolidays");
        const employees = DB.get("employees");
        const brands = DB.get("brands");
        const processes = DB.get("processes");
        const dates = getMonthDates(year, month);
        const assignmentsByPair = new Map();
        assignments.forEach(assignment => {
            const key = `${assignment.brandId}__${assignment.processId}`;
            if (!assignmentsByPair.has(key)) assignmentsByPair.set(key, []);
            assignmentsByPair.get(key).push(assignment);
        });

        freshData.conflicts = [];

        brandProcessRules.forEach(bpr => {
            const key = `${bpr.brandId}__${bpr.processId}`;
            const assignedEmps = assignmentsByPair.get(key) || [];
            freshData.coverage[key] = {};
            dates.forEach(d => {
                const ds = isoDate(d);
                const required = isRequiredWorkDay(d, bpr.workingRule, publicHolidays, bpr.workingDays, bpr.includeHolidays);
                if (!required) {
                    freshData.coverage[key][ds] = { required: false, working: [], conflict: false };
                    return;
                }
                const workingEmps = assignedEmps.filter(a => (freshData.roster[a.empId] || {})[ds] === "work").map(a => a.empId);
                const needed = getRequiredStaff(bpr, d);
                const hasConflict = workingEmps.length < needed;
                freshData.coverage[key][ds] = { required: true, working: workingEmps, needed, conflict: hasConflict };
                if (hasConflict) {
                    const brand = brands.find(b => b.id === bpr.brandId);
                    const process = processes.find(p => p.id === bpr.processId);
                    const assignedNames = assignedEmps.map(a => employees.find(e => e.id === a.empId)?.name || a.empId);
                    const offEmps = assignedEmps
                        .filter(a => (freshData.roster[a.empId] || {})[ds] !== "work")
                        .map(a => {
                            const emp = employees.find(e => e.id === a.empId);
                            const status = (freshData.roster[a.empId] || {})[ds];
                            return `${emp?.name || a.empId} (${status})`;
                        });
                    freshData.conflicts.push({
                        type: "coverage-gap", date: ds, brandId: bpr.brandId, processId: bpr.processId,
                        brandName: brand?.name, processName: process?.name,
                        required: needed, available: workingEmps.length,
                        assignedEmployees: assignedNames, offEmployees: offEmps,
                        severity: "critical",
                        message: `${brand?.name} - ${process?.name} needs ${needed} staff on ${ds} but only ${workingEmps.length} available. Unavailable: ${offEmps.join(", ")}`,
                    });
                }
            });
        });

        const rulesByPair = new Map(brandProcessRules.map(rule => [`${rule.brandId}__${rule.processId}`, rule]));
        dates.forEach(date => {
            freshData.conflicts.push(...findAssignmentOverlaps(assignments, rulesByPair, employees, freshData.roster, isoDate(date), publicHolidays));
        });

        freshData.manualOverrides = validOverrides;
        rosters[rosterKey] = freshData;
        DB.setObj("rosters", rosters);
        return freshData;
    }

    // Apply a manual override to a roster
    function applyOverride(rosterKey, empId, date, newStatus) {
        const rosters = DB.getObj("rosters");
        if (!rosters[rosterKey]) return null;

        if (!rosters[rosterKey].manualOverrides) rosters[rosterKey].manualOverrides = {};
        if (!rosters[rosterKey].manualOverrides[empId]) rosters[rosterKey].manualOverrides[empId] = {};
        rosters[rosterKey].manualOverrides[empId][date] = newStatus;
        rosters[rosterKey].roster[empId][date] = newStatus;
        DB.setObj("rosters", rosters);
        return revalidateRoster(rosterKey);
    }

    // Get summary stats for a roster
    function getRosterStats(rosterData) {
        const { roster, coverage, conflicts } = rosterData;
        const employees = DB.get("employees");
        const stats = {
            totalEmployees: employees.length,
            totalConflicts: conflicts.length,
            coverageGaps: conflicts.filter(c => c.type === "coverage-gap").length,
            employeeStats: {},
        };

        employees.forEach(emp => {
            const empRoster = roster[emp.id] || {};
            const days = Object.values(empRoster);
            stats.employeeStats[emp.id] = {
                workDays: days.filter(s => s === "work").length,
                leaveDays: days.filter(s => s === "leave").length,
                weeklyOffDays: days.filter(s => s === "weekly-off").length,
                compOffDays: days.filter(s => s === "comp-off").length,
            };
        });

        return stats;
    }

    // Get backup suggestions when a coverage gap occurs
    function getSuggestedBackups(brandId, processId, date, excludeEmpIds) {
        const employees = DB.get("employees");
        const assignments = DB.get("assignments");
        const brands = DB.get("brands");
        const rosters = DB.getObj("rosters");

        const brand = brands.find(b => b.id === brandId);
        const samePodEmps = employees.filter(e => {
            if (brand && e.podId !== brand.podId) return false;
            return !excludeEmpIds.includes(e.id);
        });

        // Find all roster keys
        const rosterKeys = Object.keys(rosters);
        const suggestions = [];

        samePodEmps.forEach(emp => {
            // Check if employee is working on that date across any roster
            let available = true;
            rosterKeys.forEach(key => {
                const r = rosters[key];
                if (r.roster && r.roster[emp.id] && r.roster[emp.id][date]) {
                    if (r.roster[emp.id][date] !== "work") available = false;
                }
            });

            if (available) {
                const empProcesses = assignments.filter(a => a.empId === emp.id).map(a => a.processId);
                suggestions.push({
                    empId: emp.id,
                    empName: emp.name,
                    availableOnDate: true,
                    handlesProcess: assignments.some(a => a.empId === emp.id && a.processId === processId),
                    note: empProcesses.length > 0 ? "Cross-assignment may be needed" : "New assignment required",
                });
            }
        });

        return suggestions.slice(0, 5);
    }

    return {
        getDaysInMonth,
        getMonthDates,
        isoDate,
        isRequiredWorkDay,
        getEmployeeStatus,
        generateRoster,
        detectConflicts,
        revalidateRoster,
        applyOverride,
        getRosterStats,
        getSuggestedBackups,
        isHoliday,
        isSunday,
    };
})();
