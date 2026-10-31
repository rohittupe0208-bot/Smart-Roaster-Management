// ============================================================
// DATASTRAW SMART ROSTER MANAGEMENT SYSTEM
// Sample Dataset & Data Initialization
// ============================================================

const SAMPLE_DATA = {
    pods: [
        { id: "pod1", name: "Alpha Pod", leadId: "emp1" },
        { id: "pod2", name: "Beta Pod", leadId: "emp9" },
        { id: "pod3", name: "Gamma Pod", leadId: "emp17" },
        { id: "pod4", name: "Delta Pod", leadId: "emp25" },
    ],

    brands: [
        { id: "b1", name: "FreshBloom", podId: "pod1" },
        { id: "b2", name: "SwiftCart", podId: "pod1" },
        { id: "b3", name: "NovaNest", podId: "pod1" },
        { id: "b4", name: "LuxeGroom", podId: "pod1" },
        { id: "b5", name: "PureHarvest", podId: "pod1" },
        { id: "b6", name: "UrbanPulse", podId: "pod1" },
        { id: "b7", name: "GlowBox", podId: "pod2" },
        { id: "b8", name: "TechTrove", podId: "pod2" },
        { id: "b9", name: "ZenLife", podId: "pod2" },
        { id: "b10", name: "FitFuel", podId: "pod2" },
        { id: "b11", name: "SkyWear", podId: "pod2" },
        { id: "b12", name: "CrispKitchen", podId: "pod3" },
        { id: "b13", name: "MindMate", podId: "pod3" },
        { id: "b14", name: "DenimCo", podId: "pod3" },
        { id: "b15", name: "OrganicOak", podId: "pod3" },
        { id: "b16", name: "PetPaws", podId: "pod3" },
        { id: "b17", name: "SparkBrew", podId: "pod4" },
        { id: "b18", name: "MomentCo", podId: "pod4" },
        { id: "b19", name: "ThreadBox", podId: "pod4" },
        { id: "b20", name: "NestNook", podId: "pod4" },
    ],

    processes: [
        { id: "pr1", name: "Customer Support", code: "CS" },
        { id: "pr2", name: "Abandoned Cart Conversions", code: "ACC" },
        { id: "pr3", name: "NDR Management", code: "NDR" },
        { id: "pr4", name: "Retention", code: "RET" },
        { id: "pr5", name: "Quality Assurance", code: "QA" },
    ],

    // workingRule: '365' | 'no-holidays' | 'no-sunday-holidays'
    brandProcessRules: [
        // FreshBloom - CS 365, ACC no-holidays
        { id: "bpr1", brandId: "b1", processId: "pr1", workingRule: "365", minStaff: 1 },
        { id: "bpr2", brandId: "b1", processId: "pr2", workingRule: "no-holidays", minStaff: 1 },
        // SwiftCart - CS 365, NDR no-sunday-holidays
        { id: "bpr3", brandId: "b2", processId: "pr1", workingRule: "365", minStaff: 1 },
        { id: "bpr4", brandId: "b2", processId: "pr3", workingRule: "no-sunday-holidays", minStaff: 1 },
        // NovaNest - CS no-holidays
        { id: "bpr5", brandId: "b3", processId: "pr1", workingRule: "no-holidays", minStaff: 1 },
        // LuxeGroom - CS no-sunday-holidays
        { id: "bpr6", brandId: "b4", processId: "pr1", workingRule: "no-sunday-holidays", minStaff: 1 },
        // PureHarvest - CS 365, RET no-holidays
        { id: "bpr7", brandId: "b5", processId: "pr1", workingRule: "365", minStaff: 1 },
        { id: "bpr8", brandId: "b5", processId: "pr4", workingRule: "no-holidays", minStaff: 1 },
        // UrbanPulse - CS 365, ACC 365, NDR no-sunday-holidays (multi-employee brand)
        { id: "bpr9", brandId: "b6", processId: "pr1", workingRule: "365", minStaff: 1 },
        { id: "bpr10", brandId: "b6", processId: "pr2", workingRule: "365", minStaff: 1 },
        { id: "bpr11", brandId: "b6", processId: "pr3", workingRule: "no-sunday-holidays", minStaff: 1 },
        // GlowBox - CS no-holidays, ACC no-sunday-holidays
        { id: "bpr12", brandId: "b7", processId: "pr1", workingRule: "no-holidays", minStaff: 1 },
        { id: "bpr13", brandId: "b7", processId: "pr2", workingRule: "no-sunday-holidays", minStaff: 1 },
        // TechTrove - CS 365, NDR 365, QA no-holidays (multi-employee brand)
        { id: "bpr14", brandId: "b8", processId: "pr1", workingRule: "365", minStaff: 1 },
        { id: "bpr15", brandId: "b8", processId: "pr3", workingRule: "365", minStaff: 1 },
        { id: "bpr16", brandId: "b8", processId: "pr5", workingRule: "no-holidays", minStaff: 1 },
        // ZenLife - CS no-sunday-holidays
        { id: "bpr17", brandId: "b9", processId: "pr1", workingRule: "no-sunday-holidays", minStaff: 1 },
        // FitFuel - CS 365, ACC no-holidays
        { id: "bpr18", brandId: "b10", processId: "pr1", workingRule: "365", minStaff: 1 },
        { id: "bpr19", brandId: "b10", processId: "pr2", workingRule: "no-holidays", minStaff: 1 },
        // SkyWear - CS no-sunday-holidays, RET no-sunday-holidays (multi-employee)
        { id: "bpr20", brandId: "b11", processId: "pr1", workingRule: "no-sunday-holidays", minStaff: 1 },
        { id: "bpr21", brandId: "b11", processId: "pr4", workingRule: "no-sunday-holidays", minStaff: 1 },
        // CrispKitchen - CS 365
        { id: "bpr22", brandId: "b12", processId: "pr1", workingRule: "365", minStaff: 1 },
        // MindMate - CS no-holidays, ACC no-sunday-holidays
        { id: "bpr23", brandId: "b13", processId: "pr1", workingRule: "no-holidays", minStaff: 1 },
        { id: "bpr24", brandId: "b13", processId: "pr2", workingRule: "no-sunday-holidays", minStaff: 1 },
        // DenimCo - CS no-sunday-holidays
        { id: "bpr25", brandId: "b14", processId: "pr1", workingRule: "no-sunday-holidays", minStaff: 1 },
        // OrganicOak - CS 365, NDR no-holidays
        { id: "bpr26", brandId: "b15", processId: "pr1", workingRule: "365", minStaff: 1 },
        { id: "bpr27", brandId: "b15", processId: "pr3", workingRule: "no-holidays", minStaff: 1 },
        // PetPaws - CS no-holidays, ACC no-sunday-holidays (multi-employee)
        { id: "bpr28", brandId: "b16", processId: "pr1", workingRule: "no-holidays", minStaff: 1 },
        { id: "bpr29", brandId: "b16", processId: "pr2", workingRule: "no-sunday-holidays", minStaff: 1 },
        // SparkBrew - CS 365, RET no-holidays
        { id: "bpr30", brandId: "b17", processId: "pr1", workingRule: "365", minStaff: 1 },
        { id: "bpr31", brandId: "b17", processId: "pr4", workingRule: "no-holidays", minStaff: 1 },
        // MomentCo - CS no-sunday-holidays
        { id: "bpr32", brandId: "b18", processId: "pr1", workingRule: "no-sunday-holidays", minStaff: 1 },
        // ThreadBox - CS no-holidays, NDR no-sunday-holidays
        { id: "bpr33", brandId: "b19", processId: "pr1", workingRule: "no-holidays", minStaff: 1 },
        { id: "bpr34", brandId: "b19", processId: "pr3", workingRule: "no-sunday-holidays", minStaff: 1 },
        // NestNook - CS 365, ACC 365 (multi-employee, shared process)
        { id: "bpr35", brandId: "b20", processId: "pr1", workingRule: "365", minStaff: 2 },
        { id: "bpr36", brandId: "b20", processId: "pr2", workingRule: "no-holidays", minStaff: 1 },
    ],

    employees: [
        // POD 1 - Alpha Pod (Lead: Arjun Mehta emp1)
        { id: "emp1", name: "Arjun Mehta", podId: "pod1", isPodLead: true, weeklyOffDay: 0, employeeCode: "AM001" },
        { id: "emp2", name: "Priya Sharma", podId: "pod1", isPodLead: false, weeklyOffDay: 6, employeeCode: "PS002" },
        { id: "emp3", name: "Rahul Gupta", podId: "pod1", isPodLead: false, weeklyOffDay: 0, employeeCode: "RG003" },
        { id: "emp4", name: "Sneha Patel", podId: "pod1", isPodLead: false, weeklyOffDay: 6, employeeCode: "SP004" },
        { id: "emp5", name: "Vikram Singh", podId: "pod1", isPodLead: false, weeklyOffDay: 0, employeeCode: "VS005" },
        { id: "emp6", name: "Anjali Rao", podId: "pod1", isPodLead: false, weeklyOffDay: 6, employeeCode: "AR006" },
        { id: "emp7", name: "Karan Joshi", podId: "pod1", isPodLead: false, weeklyOffDay: 0, employeeCode: "KJ007" },
        { id: "emp8", name: "Meera Nair", podId: "pod1", isPodLead: false, weeklyOffDay: 6, employeeCode: "MN008" },
        // POD 2 - Beta Pod (Lead: Deepak Kumar emp9)
        { id: "emp9", name: "Deepak Kumar", podId: "pod2", isPodLead: true, weeklyOffDay: 0, employeeCode: "DK009" },
        { id: "emp10", name: "Pooja Verma", podId: "pod2", isPodLead: false, weeklyOffDay: 6, employeeCode: "PV010" },
        { id: "emp11", name: "Rohit Desai", podId: "pod2", isPodLead: false, weeklyOffDay: 0, employeeCode: "RD011" },
        { id: "emp12", name: "Kavita Menon", podId: "pod2", isPodLead: false, weeklyOffDay: 6, employeeCode: "KM012" },
        { id: "emp13", name: "Suresh Iyer", podId: "pod2", isPodLead: false, weeklyOffDay: 0, employeeCode: "SI013" },
        { id: "emp14", name: "Nisha Kapoor", podId: "pod2", isPodLead: false, weeklyOffDay: 6, employeeCode: "NK014" },
        { id: "emp15", name: "Amit Tiwari", podId: "pod2", isPodLead: false, weeklyOffDay: 0, employeeCode: "AT015" },
        { id: "emp16", name: "Ritu Agarwal", podId: "pod2", isPodLead: false, weeklyOffDay: 6, employeeCode: "RA016" },
        // POD 3 - Gamma Pod (Lead: Sanjay Bhatt emp17)
        { id: "emp17", name: "Sanjay Bhatt", podId: "pod3", isPodLead: true, weeklyOffDay: 0, employeeCode: "SB017" },
        { id: "emp18", name: "Lalita Choudhary", podId: "pod3", isPodLead: false, weeklyOffDay: 6, employeeCode: "LC018" },
        { id: "emp19", name: "Nikhil Pandey", podId: "pod3", isPodLead: false, weeklyOffDay: 0, employeeCode: "NP019" },
        { id: "emp20", name: "Divya Sinha", podId: "pod3", isPodLead: false, weeklyOffDay: 6, employeeCode: "DS020" },
        { id: "emp21", name: "Ajay Mishra", podId: "pod3", isPodLead: false, weeklyOffDay: 0, employeeCode: "AM021" },
        { id: "emp22", name: "Sunita Yadav", podId: "pod3", isPodLead: false, weeklyOffDay: 6, employeeCode: "SY022" },
        { id: "emp23", name: "Manish Saxena", podId: "pod3", isPodLead: false, weeklyOffDay: 0, employeeCode: "MS023" },
        { id: "emp24", name: "Preeti Shah", podId: "pod3", isPodLead: false, weeklyOffDay: 6, employeeCode: "PS024" },
        // POD 4 - Delta Pod (Lead: Farhan Khan emp25)
        { id: "emp25", name: "Farhan Khan", podId: "pod4", isPodLead: true, weeklyOffDay: 0, employeeCode: "FK025" },
        { id: "emp26", name: "Rekha Pillai", podId: "pod4", isPodLead: false, weeklyOffDay: 6, employeeCode: "RP026" },
        { id: "emp27", name: "Tarun Malhotra", podId: "pod4", isPodLead: false, weeklyOffDay: 0, employeeCode: "TM027" },
        { id: "emp28", name: "Geeta Reddy", podId: "pod4", isPodLead: false, weeklyOffDay: 6, employeeCode: "GR028" },
        { id: "emp29", name: "Pranav Jain", podId: "pod4", isPodLead: false, weeklyOffDay: 0, employeeCode: "PJ029" },
        { id: "emp30", name: "Simran Kaur", podId: "pod4", isPodLead: false, weeklyOffDay: 6, employeeCode: "SK030" },
        { id: "emp31", name: "Vivek Tripathi", podId: "pod4", isPodLead: false, weeklyOffDay: 0, employeeCode: "VT031" },
        { id: "emp32", name: "Ananya Bose", podId: "pod4", isPodLead: false, weeklyOffDay: 6, employeeCode: "AB032" },
    ],

    // Employee-Brand-Process assignments
    // Each process for a brand has a different assigned employee. NestNook CS
    // intentionally has two employees to meet its minStaff=2 coverage rule.
    assignments: [
        // POD 1 - Alpha Pod
        // FreshBloom (b1): emp2 handles CS, emp3 handles ACC
        { id: "asgn1", empId: "emp2", brandId: "b1", processId: "pr1" },
        { id: "asgn2", empId: "emp3", brandId: "b1", processId: "pr2" },
        // SwiftCart (b2): different employees handle CS and NDR
        { id: "asgn3", empId: "emp4", brandId: "b2", processId: "pr1" },
        { id: "asgn4", empId: "emp5", brandId: "b2", processId: "pr3" },
        // NovaNest (b3): emp5 handles CS - single employee
        { id: "asgn5", empId: "emp5", brandId: "b3", processId: "pr1" },
        // LuxeGroom (b4): emp6 handles CS - single employee
        { id: "asgn6", empId: "emp6", brandId: "b4", processId: "pr1" },
        // PureHarvest (b5): different employees handle CS and RET
        { id: "asgn7", empId: "emp7", brandId: "b5", processId: "pr1" },
        { id: "asgn8", empId: "emp8", brandId: "b5", processId: "pr4" },
        // UrbanPulse (b6): 3 employees (emp1=CS, emp2=ACC, emp8=NDR) - also emp1 is pod lead
        { id: "asgn9", empId: "emp1", brandId: "b6", processId: "pr1" },
        { id: "asgn10", empId: "emp2", brandId: "b6", processId: "pr2" }, // emp2 also on b1
        { id: "asgn11", empId: "emp8", brandId: "b6", processId: "pr3" },

        // POD 2 - Beta Pod
        // GlowBox (b7): different employees handle CS and ACC
        { id: "asgn12", empId: "emp10", brandId: "b7", processId: "pr1" },
        { id: "asgn13", empId: "emp11", brandId: "b7", processId: "pr2" },
        // TechTrove (b8): 3 employees (emp11=CS, emp12=NDR, emp13=QA) - multi-employee
        { id: "asgn14", empId: "emp11", brandId: "b8", processId: "pr1" },
        { id: "asgn15", empId: "emp12", brandId: "b8", processId: "pr3" },
        { id: "asgn16", empId: "emp13", brandId: "b8", processId: "pr5" },
        // ZenLife (b9): emp14 handles CS - single employee
        { id: "asgn17", empId: "emp14", brandId: "b9", processId: "pr1" },
        // FitFuel (b10): different employees handle CS and ACC
        { id: "asgn18", empId: "emp15", brandId: "b10", processId: "pr1" },
        { id: "asgn19", empId: "emp16", brandId: "b10", processId: "pr2" },
        // SkyWear (b11): different employees handle CS and RET
        { id: "asgn20", empId: "emp9", brandId: "b11", processId: "pr1" },
        { id: "asgn21", empId: "emp10", brandId: "b11", processId: "pr4" },

        // POD 3 - Gamma Pod
        // CrispKitchen (b12): emp18 handles CS - single employee
        { id: "asgn22", empId: "emp18", brandId: "b12", processId: "pr1" },
        // MindMate (b13): different employees handle CS and ACC
        { id: "asgn23", empId: "emp19", brandId: "b13", processId: "pr1" },
        { id: "asgn24", empId: "emp20", brandId: "b13", processId: "pr2" },
        // DenimCo (b14): emp21 handles CS - single employee
        { id: "asgn25", empId: "emp21", brandId: "b14", processId: "pr1" },
        // OrganicOak (b15): different employees handle CS and NDR
        { id: "asgn26", empId: "emp22", brandId: "b15", processId: "pr1" },
        { id: "asgn27", empId: "emp23", brandId: "b15", processId: "pr3" },
        // PetPaws (b16): different employees handle CS and ACC
        { id: "asgn28", empId: "emp23", brandId: "b16", processId: "pr1" },
        { id: "asgn29", empId: "emp24", brandId: "b16", processId: "pr2" },

        // POD 4 - Delta Pod
        // SparkBrew (b17): different employees handle CS and RET
        { id: "asgn31", empId: "emp26", brandId: "b17", processId: "pr1" },
        { id: "asgn32", empId: "emp27", brandId: "b17", processId: "pr4" },
        // MomentCo (b18): emp27 handles CS - single employee
        { id: "asgn33", empId: "emp27", brandId: "b18", processId: "pr1" },
        // ThreadBox (b19): emp28 handles CS, emp29 handles NDR - 2 employees
        { id: "asgn34", empId: "emp28", brandId: "b19", processId: "pr1" },
        { id: "asgn35", empId: "emp29", brandId: "b19", processId: "pr3" },
        // NestNook (b20): emp30+emp31 both handle CS (shared process, minStaff=2), emp32 handles ACC
        { id: "asgn36", empId: "emp30", brandId: "b20", processId: "pr1" },
        { id: "asgn37", empId: "emp31", brandId: "b20", processId: "pr1" }, // shared process
        { id: "asgn38", empId: "emp32", brandId: "b20", processId: "pr2" },
    ],

    // Sample public holidays for India (November 2025 used as base)
    publicHolidays: [
        { id: "ph1", date: "2025-11-01", name: "Diwali" },
        { id: "ph2", date: "2025-11-15", name: "Guru Nanak Jayanti" },
        { id: "ph3", date: "2025-12-25", name: "Christmas" },
        { id: "ph4", date: "2025-12-31", name: "New Year Eve" },
        { id: "ph5", date: "2026-01-01", name: "New Year's Day" },
        { id: "ph6", date: "2026-01-26", name: "Republic Day" },
        { id: "ph7", date: "2026-02-26", name: "Maha Shivratri" },
        { id: "ph8", date: "2026-03-25", name: "Holi" },
        { id: "ph9", date: "2026-04-14", name: "Dr. Ambedkar Jayanti" },
        { id: "ph10", date: "2026-05-01", name: "Maharashtra Day" },
        { id: "ph11", date: "2026-08-15", name: "Independence Day" },
        { id: "ph12", date: "2026-10-02", name: "Gandhi Jayanti" },
        { id: "ph13", date: "2026-10-20", name: "Dussehra" },
        { id: "ph14", date: "2026-11-08", name: "Diwali" },
    ],

    // Sample leaves (will be augmented by user)
    leaves: [
        { id: "lv1", empId: "emp5", date: "2026-11-10", type: "PL", status: "approved", note: "Personal leave" },
        { id: "lv2", empId: "emp12", date: "2026-11-12", type: "PL", status: "approved", note: "Medical" },
        { id: "lv3", empId: "emp12", date: "2026-11-13", type: "PL", status: "approved", note: "Medical" },
        { id: "lv4", empId: "emp19", date: "2026-11-05", type: "CO", status: "approved", note: "Comp-off" },
    ],
};

// Initialize app storage
function initStorage() {
    if (!localStorage.getItem("rms_initialized")) {
        localStorage.setItem("rms_pods", JSON.stringify(SAMPLE_DATA.pods));
        localStorage.setItem("rms_brands", JSON.stringify(SAMPLE_DATA.brands));
        localStorage.setItem("rms_processes", JSON.stringify(SAMPLE_DATA.processes));
        localStorage.setItem("rms_brandProcessRules", JSON.stringify(SAMPLE_DATA.brandProcessRules));
        localStorage.setItem("rms_employees", JSON.stringify(SAMPLE_DATA.employees));
        localStorage.setItem("rms_assignments", JSON.stringify(SAMPLE_DATA.assignments));
        localStorage.setItem("rms_publicHolidays", JSON.stringify(SAMPLE_DATA.publicHolidays));
        localStorage.setItem("rms_leaves", JSON.stringify(SAMPLE_DATA.leaves));
        localStorage.setItem("rms_rosters", JSON.stringify({}));
        localStorage.setItem("rms_initialized", "1");
    }
}

// Storage helpers
const DB = {
    get: (key) => JSON.parse(localStorage.getItem("rms_" + key) || "[]"),
    set: (key, val) => localStorage.setItem("rms_" + key, JSON.stringify(val)),
    getObj: (key) => JSON.parse(localStorage.getItem("rms_" + key) || "{}"),
    setObj: (key, val) => localStorage.setItem("rms_" + key, JSON.stringify(val)),
    reset: () => {
        const keys = ["pods", "brands", "processes", "brandProcessRules", "employees", "assignments", "publicHolidays", "leaves", "rosters", "initialized"];
        keys.forEach(k => localStorage.removeItem("rms_" + k));
        initStorage();
    }
};
