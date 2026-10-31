// ============================================================
// EMPLOYEES, BRANDS, LEAVES, CONFLICTS, SETTINGS PAGES
// ============================================================

// ---- EMPLOYEES PAGE ----
function renderEmployeesPage() {
    const employees = DB.get('employees');
    const pods = DB.get('pods');
    const assignments = DB.get('assignments');
    const brands = DB.get('brands');
    const processes = DB.get('processes');
    const selPod = App.filters.pod || '';

    let podOpts = `<option value="">All Pods</option>${pods.map(p => `<option value="${p.id}" ${selPod === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}`;
    const filtered = selPod ? employees.filter(e => e.podId === selPod) : employees;

    document.getElementById('page-content').innerHTML = `
<div class="fade-in">
  <div class="toolbar">
    <select class="form-control" style="max-width:200px" aria-label="Filter people by pod" onchange="App.filters.pod=this.value;renderEmployeesPage()">${podOpts}</select>
    <button class="btn btn-primary" onclick="showAddEmployeeModal()">Add person</button>
    <button class="btn btn-secondary" onclick="showAddPodModal()">Add pod</button>
  </div>

  <div class="grid-2 mb-4">
    ${pods.map(pod => {
        const podEmps = employees.filter(e => e.podId === pod.id);
        const lead = employees.find(e => e.id === pod.leadId);
        return `<div class="card">
        <div class="card-header">
          <div><div class="card-title" style="display:flex;align-items:center;gap:8px">
            <div class="emp-avatar" style="background:var(--primary);width:32px;height:32px;font-size:11px">${pod.name.slice(0, 2)}</div>
            ${pod.name}
          </div>
          <div class="card-subtitle">Lead: ${lead?.name || '—'}</div></div>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="badge badge-primary">${podEmps.length}</span>
            <button class="btn btn-xs btn-secondary" onclick="showEditPodModal('${pod.id}')">Edit</button>
            <button class="btn btn-xs btn-danger" onclick="deletePod('${pod.id}')">✕</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${podEmps.map(emp => {
            const empAssign = assignments.filter(a => a.empId === emp.id);
            const empBrands = [...new Set(empAssign.map(a => a.brandId))].map(id => brands.find(b => b.id === id)?.name || '?');
            return `<div class="emp-card">
              <div class="emp-avatar" style="background:var(--primary)">${initials(emp.name)}</div>
              <div class="emp-info">
                <div class="name">${emp.name} ${emp.isPodLead ? '<span class="badge badge-warning" style="font-size:10px">Lead</span>' : ''}</div>
                <div class="code">${emp.employeeCode} &bull; Off: ${DAY_NAMES[emp.weeklyOffDay]}</div>
                <div class="pod">${empBrands.length > 0 ? empBrands.slice(0, 3).join(', ') + (empBrands.length > 3 ? '...' : '') : 'No brands assigned'}</div>
              </div>
              <div class="actions">
                <button class="btn btn-xs btn-secondary" aria-label="Edit ${emp.name}" onclick="showEditEmployeeModal('${emp.id}')">Edit</button>
                <button class="btn btn-xs btn-danger" aria-label="Remove ${emp.name}" onclick="deleteEmployee('${emp.id}')">Remove</button>
              </div>
            </div>`;
        }).join('')}
        </div>
      </div>`;
    }).join('')}
  </div>

  <div class="card">
    <div class="card-header"><div><div class="card-title">People</div><div class="card-subtitle">Showing ${filtered.length} ${filtered.length === 1 ? 'person' : 'people'}</div></div></div>
    <div class="table-wrapper"><table>
      <thead><tr><th>Name</th><th>Code</th><th>Pod</th><th>Weekly Off</th><th>Brands</th><th>Processes</th><th>Actions</th></tr></thead>
      <tbody>
      ${filtered.map(emp => {
        const pod = pods.find(p => p.id === emp.podId);
        const empAssign = assignments.filter(a => a.empId === emp.id);
        const empBrands = [...new Set(empAssign.map(a => a.brandId))].map(id => brands.find(b => b.id === id)?.name || '?');
        const empProcs = [...new Set(empAssign.map(a => a.processId))].map(id => processes.find(p => p.id === id));
        return `<tr>
          <td><div style="display:flex;align-items:center;gap:8px"><div class="emp-avatar" style="background:var(--primary);width:28px;height:28px;font-size:10px">${initials(emp.name)}</div><span class="emp-name">${emp.name}</span>${emp.isPodLead ? '<span class="badge badge-warning" style="font-size:10px">Pod lead</span>' : ''}</div></td>
          <td><span class="badge badge-muted">${emp.employeeCode}</span></td>
          <td>${pod?.name || '—'}</td>
          <td>${DAY_NAMES[emp.weeklyOffDay]}</td>
          <td>${empBrands.slice(0, 3).map(b => `<span class="tag" style="font-size:10px">${b}</span>`).join('')}${empBrands.length > 3 ? `<span style="font-size:10px;color:var(--text-muted)">+${empBrands.length - 3}</span>` : ''}</td>
          <td>${empProcs.map(p => `<span class="chip chip-${PROCESS_CHIPS[p?.id] || 'cs'}">${p?.code || '?'}</span>`).join('')}</td>
          <td><div style="display:flex;gap:6px"><button class="btn btn-xs btn-secondary" onclick="showEditEmployeeModal('${emp.id}')">Edit</button><button class="btn btn-xs btn-danger" onclick="deleteEmployee('${emp.id}')">Remove</button></div></td>
        </tr>`;
    }).join('')}
      </tbody>
    </table></div>
  </div>
</div>`;
}

function showAddEmployeeModal(prefillId) {
    const pods = DB.get('pods');
    openModal(`<div class="modal-header"><div class="modal-title">${prefillId ? 'Edit' : 'Add'} person</div><button type="button" class="modal-close" aria-label="Close dialog" onclick="closeModal()">×</button></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="emp-name" placeholder="Arjun Mehta"></div>
      <div class="form-group"><label class="form-label">Employee Code</label><input class="form-control" id="emp-code" placeholder="AM001"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Pod</label><select class="form-control" id="emp-pod">${pods.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Weekly Off Day</label><select class="form-control" id="emp-woff">${DAY_NAMES.map((d, i) => `<option value="${i}">${d}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label class="form-label"><input type="checkbox" id="emp-lead"> Is Pod Lead</label></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEmployee(null)">Save Employee</button>
    </div>`);
}

function showEditEmployeeModal(empId) {
    const employees = DB.get('employees'); const pods = DB.get('pods');
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    openModal(`<div class="modal-header"><div class="modal-title">Edit person</div><button type="button" class="modal-close" aria-label="Close dialog" onclick="closeModal()">×</button></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="emp-name" value="${emp.name}"></div>
      <div class="form-group"><label class="form-label">Employee Code</label><input class="form-control" id="emp-code" value="${emp.employeeCode}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Pod</label><select class="form-control" id="emp-pod">${pods.map(p => `<option value="${p.id}" ${p.id === emp.podId ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Weekly Off Day</label><select class="form-control" id="emp-woff">${DAY_NAMES.map((d, i) => `<option value="${i}" ${i === emp.weeklyOffDay ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label class="form-label"><input type="checkbox" id="emp-lead" ${emp.isPodLead ? 'checked' : ''}> Is Pod Lead</label></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEmployee('${empId}')">Update Employee</button>
    </div>`);
}

function saveEmployee(id) {
    const name = document.getElementById('emp-name').value.trim();
    const code = document.getElementById('emp-code').value.trim();
    const podId = document.getElementById('emp-pod').value;
    const weeklyOffDay = +document.getElementById('emp-woff').value;
    const isPodLead = document.getElementById('emp-lead').checked;
    if (!name || !code) { showToast('Name and code are required', 'error'); return; }
    const employees = DB.get('employees');
    if (employees.some(e => e.employeeCode.toLowerCase() === code.toLowerCase() && e.id !== id)) {
        showToast('Employee code already exists', 'error'); return;
    }
    const previous = employees.find(e => e.id === id);
    if (id) {
        const idx = employees.findIndex(e => e.id === id);
        if (idx > -1) employees[idx] = { ...employees[idx], name, employeeCode: code, podId, weeklyOffDay, isPodLead };
    } else {
        const newId = 'emp' + Date.now();
        employees.push({ id: newId, name, employeeCode: code, podId, weeklyOffDay, isPodLead });
    }
    DB.set('employees', employees);
    const pods = DB.get('pods');
    const savedEmployee = employees.find(e => e.id === id) || employees[employees.length - 1];
    if (previous?.isPodLead && (previous.podId !== podId || !isPodLead)) {
        const oldPod = pods.find(p => p.id === previous.podId);
        if (oldPod?.leadId === id) oldPod.leadId = '';
    }
    if (isPodLead) {
        const pod = pods.find(p => p.id === podId);
        if (pod) {
            const oldLead = employees.find(e => e.id === pod.leadId && e.id !== savedEmployee.id);
            if (oldLead) oldLead.isPodLead = false;
            pod.leadId = savedEmployee.id;
        }
    }
    DB.set('employees', employees);
    DB.set('pods', pods);
    revalidateAllRosters();
    closeModal(); renderEmployeesPage();
    showToast(id ? 'Employee updated!' : 'Employee added!', 'success');
}

function deleteEmployee(id) {
    if (!confirm('Delete this employee? Their assignments will also be removed.')) return;
    const employees = DB.get('employees').filter(e => e.id !== id);
    const assignments = DB.get('assignments').filter(a => a.empId !== id);
    const leaves = DB.get('leaves').filter(l => l.empId !== id);
    const pods = DB.get('pods');
    pods.forEach(p => { if (p.leadId === id) p.leadId = ''; });
    DB.set('employees', employees); DB.set('assignments', assignments);
    DB.set('leaves', leaves); DB.set('pods', pods);
    revalidateAllRosters();
    renderEmployeesPage(); showToast('Employee deleted', 'info');
}

function showAddPodModal() {
    showPodModal();
}

function showEditPodModal(id) {
    showPodModal(id);
}

function showPodModal(id) {
    const employees = DB.get('employees');
    const pod = id ? DB.get('pods').find(p => p.id === id) : null;
    if (id && !pod) { showToast('Pod not found', 'error'); return; }
    openModal(`<div class="modal-header"><div class="modal-title">${pod ? 'Edit' : 'Add'} pod</div><button type="button" class="modal-close" aria-label="Close dialog" onclick="closeModal()">×</button></div>
    <div class="form-group"><label class="form-label">Pod Name</label><input class="form-control" id="pod-name" value="${pod?.name || ''}" placeholder="Alpha Pod"></div>
    <div class="form-group"><label class="form-label">Pod Lead</label><select class="form-control" id="pod-lead"><option value="">— None —</option>${employees.map(e => `<option value="${e.id}" ${e.id === pod?.leadId ? 'selected' : ''}>${e.name}</option>`).join('')}</select></div>
    <div class="form-hint">A pod lead must belong to this pod. Move employees between pods from the employee editor.</div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="savePod('${id || ''}')">${pod ? 'Update' : 'Save'} Pod</button></div>`);
}

function savePod(id) {
    const name = document.getElementById('pod-name').value.trim();
    const leadId = document.getElementById('pod-lead').value;
    if (!name) { showToast('Pod name required', 'error'); return; }
    const employees = DB.get('employees');
    const pods = DB.get('pods');
    if (pods.some(p => p.name.toLowerCase() === name.toLowerCase() && p.id !== id)) { showToast('Pod name already exists', 'error'); return; }
    const pod = pods.find(p => p.id === id);
    if (id && !pod) { showToast('Pod not found', 'error'); return; }
    const selectedLead = employees.find(e => e.id === leadId);
    if (leadId && (!selectedLead || (id && selectedLead.podId !== id))) {
        showToast('Move the selected employee into this pod before assigning them as lead', 'error'); return;
    }
    const podId = id || 'pod' + Date.now();
    const oldLeadId = pod?.leadId;
    if (oldLeadId && oldLeadId !== leadId) {
        const oldLead = employees.find(e => e.id === oldLeadId);
        if (oldLead) oldLead.isPodLead = false;
    }
    if (leadId) {
        pods.forEach(p => { if (p.id !== id && p.leadId === leadId) p.leadId = ''; });
        if (!id && selectedLead.podId) {
            const previousPod = pods.find(p => p.id === selectedLead.podId);
            if (previousPod?.leadId === leadId) previousPod.leadId = '';
        }
        selectedLead.podId = podId;
        selectedLead.isPodLead = true;
    }
    if (pod) { pod.name = name; pod.leadId = leadId; }
    else pods.push({ id: podId, name, leadId });
    DB.set('employees', employees); DB.set('pods', pods); closeModal(); renderEmployeesPage();
    showToast(pod ? 'Pod updated!' : 'Pod added!', 'success');
}

function deletePod(id) {
    const hasEmployees = DB.get('employees').some(employee => employee.podId === id);
    const hasBrands = DB.get('brands').some(brand => brand.podId === id);
    if (hasEmployees || hasBrands) {
        showToast('Move employees and brands out of this pod before deleting it', 'error');
        return;
    }
    if (!confirm('Delete this empty pod?')) return;
    DB.set('pods', DB.get('pods').filter(pod => pod.id !== id));
    renderEmployeesPage(); showToast('Pod deleted', 'info');
}

// ---- BRANDS PAGE ----
function renderBrandsPage() {
    const brands = DB.get('brands'); const processes = DB.get('processes');
    const bprs = DB.get('brandProcessRules'); const pods = DB.get('pods');
    const assignments = DB.get('assignments'); const employees = DB.get('employees');

    document.getElementById('page-content').innerHTML = `
<div class="fade-in">
  <div class="toolbar">
    <button class="btn btn-primary" onclick="showAddBrandModal()">Add brand</button>
    <button class="btn btn-secondary" onclick="showAddAssignmentModal()">Add assignment</button>
    <button class="btn btn-secondary" onclick="showAddBprModal()">Add process rule</button>
    <button class="btn btn-secondary" onclick="showProcessModal()">Add process</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:16px">
  ${brands.map(brand => {
        const pod = pods.find(p => p.id === brand.podId);
        const brandBprs = bprs.filter(b => b.brandId === brand.id);
        const brandAssign = assignments.filter(a => a.brandId === brand.id);
        const brandEmps = [...new Set(brandAssign.map(a => a.empId))].map(id => employees.find(e => e.id === id)).filter(Boolean);
        return `<div class="card">
      <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
        <div class="brand-icon" style="background:var(--primary)">${brand.name[0]}</div>
        <div style="flex:1;min-width:200px">
          <div style="font-size:16px;font-weight:700">${brand.name}</div>
          <div style="font-size:12px;color:var(--text-muted)">Pod: ${pod?.name || '—'} &bull; ${brandEmps.length} employee${brandEmps.length !== 1 ? 's' : ''}</div>
          <div class="mt-2 tag-list">${brandEmps.map(e => `<span class="tag">${e?.name || '?'}</span>`).join('')}</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-xs btn-secondary" onclick="showEditBrandModal('${brand.id}')">Edit</button>
          <button class="btn btn-xs btn-danger" aria-label="Remove ${brand.name}" onclick="deleteBrand('${brand.id}')">Remove</button>
        </div>
      </div>
      <div class="divider"></div>
      <div class="section-label">Process rules</div>
      ${brandBprs.length === 0 ? '<div class="empty-inline">No process rules yet.</div>'
                : `<div class="table-wrapper"><table><thead><tr><th>Process</th><th>Working Rule</th><th>Min Staff</th><th>Assigned Employees</th><th></th></tr></thead><tbody>
      ${brandBprs.map(bpr => {
                    const proc = processes.find(p => p.id === bpr.processId);
                    const bprAssign = brandAssign.filter(a => a.processId === bpr.processId);
                    const assignedNames = bprAssign.map(a => employees.find(e => e.id === a.empId)?.name || '?');
                    return `<tr>
          <td><span class="chip chip-${PROCESS_CHIPS[bpr.processId] || 'cs'}">${proc?.code || '?'}</span> ${proc?.name || '?'}</td>
          <td><span class="badge badge-info">${WORKING_RULE_LABELS[bpr.workingRule] || bpr.workingRule}</span></td>
          <td>${bpr.minStaff}${bpr.minStaffByDay && Object.keys(bpr.minStaffByDay).length
                        ? '<div style="font-size:10px;color:var(--text-muted)">weekday overrides</div>' : ''}</td>
          <td>${assignedNames.map(name => `<span class="tag" style="font-size:10px">${name}</span>`).join(' ')}</td>
          <td><button class="btn btn-xs btn-secondary" onclick="showEditBprModal('${bpr.id}')">Edit</button> <button class="btn btn-xs btn-danger" aria-label="Remove ${proc?.name || 'process'} rule from ${brand.name}" onclick="deleteBpr('${bpr.id}')">Remove</button></td>
        </tr>`;
                }).join('')}
      </tbody></table></div>`}
    </div>`;
    }).join('')}
  </div>
  <div class="card mt-4">
    <div class="card-header"><div><div class="card-title">Processes</div><div class="card-subtitle">Configure the process types available to brands</div></div></div>
    <div class="tag-list">${processes.map(process => `<span class="tag">${process.code} — ${process.name}
      <button class="btn btn-xs btn-secondary" title="Edit process" aria-label="Edit ${process.name}" onclick="showProcessModal('${process.id}')">Edit</button>
      <button class="btn btn-xs btn-danger" title="Delete process" aria-label="Remove ${process.name}" onclick="deleteProcess('${process.id}')">Remove</button>
    </span>`).join('')}</div>
  </div>
  <div class="card mt-4">
    <div class="card-header"><div><div class="card-title">Assignments</div><div class="card-subtitle">${assignments.length} people assigned to brand processes</div></div>
      <button class="btn btn-xs btn-primary" onclick="showAddAssignmentModal()">Add assignment</button>
    </div>
    <div class="table-wrapper"><table><thead><tr><th>Employee</th><th>Brand</th><th>Process</th><th>Shift</th><th>Actions</th></tr></thead><tbody>
      ${assignments.map(assignment => `<tr>
        <td>${employees.find(e => e.id === assignment.empId)?.name || 'Unknown employee'}</td>
        <td>${brands.find(b => b.id === assignment.brandId)?.name || 'Unknown brand'}</td>
        <td>${processes.find(p => p.id === assignment.processId)?.name || 'Unknown process'}</td>
        <td>${assignment.shiftStart && assignment.shiftEnd ? `${assignment.shiftStart}–${assignment.shiftEnd}` : 'No shift hours'}</td>
        <td><button class="btn btn-xs btn-secondary" onclick="showEditAssignmentModal('${assignment.id}')">Edit</button>
          <button class="btn btn-xs btn-danger" onclick="deleteAssignment('${assignment.id}')">Remove</button></td>
      </tr>`).join('')}
    </tbody></table></div>
  </div>
</div>`;
}

function showAddBrandModal() {
    const pods = DB.get('pods');
    openModal(`<div class="modal-header"><div class="modal-title">Add brand</div><button type="button" class="modal-close" aria-label="Close dialog" onclick="closeModal()">×</button></div>
    <div class="form-group"><label class="form-label">Brand Name</label><input class="form-control" id="brand-name" placeholder="FreshBloom"></div>
    <div class="form-group"><label class="form-label">Pod</label><select class="form-control" id="brand-pod">${pods.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveBrand()">Save Brand</button></div>`);
}

function showEditBrandModal(id) {
    const brand = DB.get('brands').find(b => b.id === id); const pods = DB.get('pods');
    if (!brand) return;
    openModal(`<div class="modal-header"><div class="modal-title">Edit brand</div><button type="button" class="modal-close" aria-label="Close dialog" onclick="closeModal()">×</button></div>
    <div class="form-group"><label class="form-label">Brand Name</label><input class="form-control" id="brand-name" value="${brand.name}"></div>
    <div class="form-group"><label class="form-label">Pod</label><select class="form-control" id="brand-pod">${pods.map(p => `<option value="${p.id}" ${p.id === brand.podId ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveBrand('${id}')">Update Brand</button></div>`);
}

function saveBrand(id) {
    const name = document.getElementById('brand-name').value.trim();
    const podId = document.getElementById('brand-pod').value;
    if (!name) { showToast('Brand name required', 'error'); return; }
    const brands = DB.get('brands');
    if (brands.some(b => b.name.toLowerCase() === name.toLowerCase() && b.id !== id)) {
        showToast('Brand name already exists', 'error'); return;
    }
    if (id) { const idx = brands.findIndex(b => b.id === id); if (idx > -1) brands[idx] = { ...brands[idx], name, podId }; }
    else brands.push({ id: 'b' + Date.now(), name, podId });
    DB.set('brands', brands); revalidateAllRosters(); closeModal(); renderBrandsPage(); showToast('Brand saved!', 'success');
}

function deleteBrand(id) {
    if (!confirm('Delete brand? All related assignments and rules will be removed.')) return;
    DB.set('brands', DB.get('brands').filter(b => b.id !== id));
    DB.set('assignments', DB.get('assignments').filter(a => a.brandId !== id));
    DB.set('brandProcessRules', DB.get('brandProcessRules').filter(b => b.brandId !== id));
    revalidateAllRosters();
    renderBrandsPage(); showToast('Brand deleted', 'info');
}

function showAddAssignmentModal() {
    showAssignmentModal();
}

function showEditAssignmentModal(id) {
    showAssignmentModal(id);
}

function showAssignmentModal(id) {
    const employees = DB.get('employees'); const brands = DB.get('brands'); const processes = DB.get('processes');
    const assignment = id ? DB.get('assignments').find(a => a.id === id) : null;
    if (id && !assignment) { showToast('Assignment not found', 'error'); return; }
    const options = (items, selected, getLabel) => items.map(item =>
        `<option value="${item.id}" ${item.id === selected ? 'selected' : ''}>${getLabel(item)}</option>`).join('');
    openModal(`<div class="modal-header"><div class="modal-title">${assignment ? 'Edit' : 'Add'} assignment</div><button type="button" class="modal-close" aria-label="Close dialog" onclick="closeModal()">×</button></div>
    <div class="form-group"><label class="form-label">Employee</label><select class="form-control" id="asgn-emp">${options(employees, assignment?.empId, e => e.name)}</select></div>
    <div class="form-group"><label class="form-label">Brand</label><select class="form-control" id="asgn-brand">${options(brands, assignment?.brandId, b => b.name)}</select></div>
    <div class="form-group"><label class="form-label">Process</label><select class="form-control" id="asgn-proc">${options(processes, assignment?.processId, p => p.name)}</select></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Shift start (optional)</label><input class="form-control" type="time" id="asgn-start" value="${assignment?.shiftStart || ''}"></div>
      <div class="form-group"><label class="form-label">Shift end (optional)</label><input class="form-control" type="time" id="asgn-end" value="${assignment?.shiftEnd || ''}"></div>
    </div>
    <div class="form-group"><div class="form-hint">Overlapping configured shifts for the same employee are flagged during roster validation.</div></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveAssignment('${id || ''}')">${assignment ? 'Update' : 'Save'} Assignment</button></div>`);
}

function saveAssignment(id) {
    const empId = document.getElementById('asgn-emp').value;
    const brandId = document.getElementById('asgn-brand').value;
    const processId = document.getElementById('asgn-proc').value;
    const shiftStart = document.getElementById('asgn-start').value;
    const shiftEnd = document.getElementById('asgn-end').value;
    const assignments = DB.get('assignments');
    if (!empId || !brandId || !processId) { showToast('Employee, brand, and process are required', 'error'); return; }
    if (assignments.some(a => a.empId === empId && a.brandId === brandId && a.processId === processId && a.id !== id)) {
        showToast('Assignment already exists', 'warning'); return;
    }
    if (!!shiftStart !== !!shiftEnd || (shiftStart && shiftStart >= shiftEnd)) {
        showToast('Enter both shift times, with the end later than the start', 'error'); return;
    }
    const updated = { id: id || 'asgn' + Date.now(), empId, brandId, processId };
    if (shiftStart && shiftEnd) { updated.shiftStart = shiftStart; updated.shiftEnd = shiftEnd; }
    if (id) {
        const index = assignments.findIndex(a => a.id === id);
        if (index < 0) { showToast('Assignment not found', 'error'); return; }
        assignments[index] = updated;
    } else assignments.push(updated);
    DB.set('assignments', assignments); revalidateAllRosters(); closeModal(); renderBrandsPage(); showToast('Assignment saved!', 'success');
}

function deleteAssignment(id) {
    DB.set('assignments', DB.get('assignments').filter(a => a.id !== id));
    revalidateAllRosters(); renderBrandsPage(); showToast('Assignment removed', 'info');
}

function showAddBprModal() {
    showBprModal();
}

function showEditBprModal(id) {
    showBprModal(id);
}

function showBprModal(id) {
    const brands = DB.get('brands'); const processes = DB.get('processes');
    const rule = id ? DB.get('brandProcessRules').find(b => b.id === id) : null;
    if (id && !rule) { showToast('Process rule not found', 'error'); return; }
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const brandOptions = brands.map(b => `<option value="${b.id}" ${b.id === rule?.brandId ? 'selected' : ''}>${b.name}</option>`).join('');
    const processOptions = processes.map(p => `<option value="${p.id}" ${p.id === rule?.processId ? 'selected' : ''}>${p.name}</option>`).join('');
    openModal(`<div class="modal-header"><div class="modal-title">${rule ? 'Edit' : 'Add'} process rule</div><button type="button" class="modal-close" aria-label="Close dialog" onclick="closeModal()">×</button></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Brand</label><select class="form-control" id="bpr-brand">${brandOptions}</select></div>
      <div class="form-group"><label class="form-label">Process</label><select class="form-control" id="bpr-proc">${processOptions}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Working Rule</label>
        <select class="form-control" id="bpr-rule">
          <option value="365" ${rule?.workingRule === '365' ? 'selected' : ''}>365 Days (incl. Sundays & Holidays)</option>
          <option value="no-holidays" ${rule?.workingRule === 'no-holidays' ? 'selected' : ''}>No Holidays (Sundays OK)</option>
          <option value="no-sunday-holidays" ${rule?.workingRule === 'no-sunday-holidays' ? 'selected' : ''}>No Sundays & No Holidays</option>
          <option value="custom-days" ${rule?.workingRule === 'custom-days' ? 'selected' : ''}>Custom Weekdays</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Default minimum staff</label><input class="form-control" id="bpr-staff" type="number" value="${rule?.minStaff || 1}" min="1" step="1" required></div>
    </div>
    <div class="form-group"><label class="form-label">Custom operating weekdays (used with Custom Weekdays)</label>
      <div class="tag-list">${weekDays.map((day, index) => `<label class="tag"><input type="checkbox" id="bpr-workday-${index}" ${rule?.workingDays?.includes(index) ? 'checked' : ''}> ${day}</label>`).join('')}</div>
      <label class="form-label" style="margin-top:10px"><input type="checkbox" id="bpr-include-holidays" ${rule?.includeHolidays ? 'checked' : ''}> Also require work on public holidays</label>
    </div>
    <div class="form-group"><label class="form-label">Optional minimum staff by weekday</label>
      <div class="form-row">${weekDays.map((day, index) => `<div class="form-group"><label class="form-label">${day}</label><input class="form-control" id="bpr-day-${index}" type="number" min="1" step="1" placeholder="Use default" value="${rule?.minStaffByDay?.[index] || ''}"></div>`).join('')}</div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveBpr('${id || ''}')">${rule ? 'Update' : 'Save'} Rule</button></div>`);
}

function saveBpr(id) {
    const brandId = document.getElementById('bpr-brand').value;
    const processId = document.getElementById('bpr-proc').value;
    const workingRule = document.getElementById('bpr-rule').value;
    const minStaffInput = document.getElementById('bpr-staff').value;
    const minStaff = Number(minStaffInput);
    if (!Number.isInteger(minStaff) || minStaff < 1) { showToast('Minimum staff must be a positive whole number', 'error'); return; }
    if (!brandId || !processId) { showToast('Brand and process are required', 'error'); return; }
    const workingDays = [];
    for (let day = 0; day < 7; day++) {
        if (document.getElementById(`bpr-workday-${day}`).checked) workingDays.push(day);
    }
    if (workingRule === 'custom-days' && workingDays.length === 0) {
        showToast('Select at least one operating weekday', 'error'); return;
    }
    const minStaffByDay = {};
    for (let day = 0; day < 7; day++) {
        const value = document.getElementById(`bpr-day-${day}`).value;
        if (!value) continue;
        const count = Number(value);
        if (!Number.isInteger(count) || count < 1) { showToast('Weekday minimums must be positive whole numbers', 'error'); return; }
        minStaffByDay[day] = count;
    }
    const bprs = DB.get('brandProcessRules');
    if (bprs.some(b => b.brandId === brandId && b.processId === processId && b.id !== id)) {
        showToast('A rule already exists for this brand and process', 'error'); return;
    }
    const updated = { id: id || 'bpr' + Date.now(), brandId, processId, workingRule, minStaff };
    if (Object.keys(minStaffByDay).length) updated.minStaffByDay = minStaffByDay;
    if (workingRule === 'custom-days') {
        updated.workingDays = workingDays;
        updated.includeHolidays = document.getElementById('bpr-include-holidays').checked;
    }
    if (id) {
        const index = bprs.findIndex(b => b.id === id);
        if (index < 0) { showToast('Process rule not found', 'error'); return; }
        bprs[index] = updated;
    } else bprs.push(updated);
    DB.set('brandProcessRules', bprs); revalidateAllRosters(); closeModal(); renderBrandsPage(); showToast('Process rule saved!', 'success');
}

function deleteBpr(id) {
    DB.set('brandProcessRules', DB.get('brandProcessRules').filter(b => b.id !== id));
    revalidateAllRosters();
    renderBrandsPage(); showToast('Rule removed', 'info');
}

function showProcessModal(id) {
    const processes = DB.get('processes');
    const process = id ? processes.find(p => p.id === id) : null;
    if (id && !process) { showToast('Process not found', 'error'); return; }
    openModal(`<div class="modal-header"><div class="modal-title">${process ? 'Edit' : 'Add'} process</div><button type="button" class="modal-close" aria-label="Close dialog" onclick="closeModal()">×</button></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Process name</label><input class="form-control" id="process-name" value="${process?.name || ''}" placeholder="Customer Support" required></div>
      <div class="form-group"><label class="form-label">Code</label><input class="form-control" id="process-code" value="${process?.code || ''}" placeholder="CS" maxlength="8" required></div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveProcess('${id || ''}')">Save Process</button></div>`);
}

function saveProcess(id) {
    const name = document.getElementById('process-name').value.trim();
    const code = document.getElementById('process-code').value.trim().toUpperCase();
    if (!name || !code) { showToast('Process name and code are required', 'error'); return; }
    const processes = DB.get('processes');
    if (processes.some(p => (p.name.toLowerCase() === name.toLowerCase() || p.code.toLowerCase() === code.toLowerCase()) && p.id !== id)) {
        showToast('Process name and code must be unique', 'error'); return;
    }
    if (id) {
        const index = processes.findIndex(p => p.id === id);
        if (index < 0) { showToast('Process not found', 'error'); return; }
        processes[index] = { ...processes[index], name, code };
    } else processes.push({ id: 'pr' + Date.now(), name, code });
    DB.set('processes', processes); revalidateAllRosters(); closeModal(); renderBrandsPage(); showToast('Process saved!', 'success');
}

function deleteProcess(id) {
    if (!confirm('Delete this process? Its rules and assignments will also be removed.')) return;
    DB.set('processes', DB.get('processes').filter(p => p.id !== id));
    DB.set('brandProcessRules', DB.get('brandProcessRules').filter(rule => rule.processId !== id));
    DB.set('assignments', DB.get('assignments').filter(assignment => assignment.processId !== id));
    revalidateAllRosters(); renderBrandsPage(); showToast('Process deleted', 'info');
}

// ---- LEAVES PAGE ----
function renderLeavesPage() {
    const leaves = DB.get('leaves'); const employees = DB.get('employees');
    const holidays = DB.get('publicHolidays');

    document.getElementById('page-content').innerHTML = `
<div class="fade-in">
  <div class="toolbar">
    <button class="btn btn-primary" onclick="showAddLeaveModal()">Add leave or comp-off</button>
    <button class="btn btn-secondary" onclick="showAddHolidayModal()">Add holiday</button>
  </div>

  <div class="grid-2 mb-4">
    <div class="card">
      <div class="card-header"><div><div class="card-title">Leave requests</div><div class="card-subtitle">${leaves.length} requests</div></div></div>
      ${leaves.length === 0 ? '<div class="empty-state"><div class="empty-title">No leave requests</div><div class="empty-sub">New requests will appear here.</div></div>'
            : `<div style="display:flex;flex-direction:column;gap:8px">
      ${leaves.map(lv => {
                const emp = employees.find(e => e.id === lv.empId);
                return `<div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card)">
          <div class="emp-avatar" style="background:var(--primary); width:32px;height:32px;font-size:11px">${emp ? initials(emp.name) : '?'}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${emp?.name || 'Unknown'}</div>
            <div style="font-size:11px;color:var(--text-muted)">${fmtDate(lv.date)} &bull; ${LEAVE_TYPES[lv.type] || lv.type}</div>
            ${lv.note ? `<div style="font-size:11px;color:var(--text-secondary)">${lv.note}</div>` : ''}
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <span class="badge ${lv.status === 'approved' ? 'badge-success' : lv.status === 'pending' ? 'badge-warning' : 'badge-danger'}">${lv.status === 'approved' ? 'Approved' : lv.status === 'pending' ? 'Pending' : 'Rejected'}</span>
            ${lv.status === 'pending' ? `<button class="btn btn-xs btn-success" onclick="approveLeave('${lv.id}')">Approve</button>` : ''}
            <button class="btn btn-xs btn-danger" onclick="deleteLeave('${lv.id}')">Remove</button>
          </div>
        </div>`;
            }).join('')}</div>`}
    </div>

    <div class="card">
      <div class="card-header"><div><div class="card-title">Public holidays</div><div class="card-subtitle">${holidays.length} dates</div></div><button class="btn btn-xs btn-secondary" onclick="showAddHolidayModal()">Add holiday</button></div>
      <div class="table-wrapper"><table><thead><tr><th>Date</th><th>Holiday</th><th></th></tr></thead><tbody>
      ${holidays.length === 0 ? '<tr><td colspan="3" class="empty-inline">No public holidays added.</td></tr>' : holidays.sort((a, b) => a.date.localeCompare(b.date)).map(h => `<tr>
        <td>${fmtDate(h.date)}</td>
        <td>${h.name}</td>
        <td><button class="btn btn-xs btn-danger" onclick="deleteHoliday('${h.id}')">Remove</button></td>
      </tr>`).join('')}
      </tbody></table></div>
    </div>
  </div>
</div>`;
}

function showAddLeaveModal() {
    const employees = DB.get('employees');
    openModal(`<div class="modal-header"><div class="modal-title">Add leave or comp-off</div><button type="button" class="modal-close" aria-label="Close dialog" onclick="closeModal()">×</button></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Employee</label><select class="form-control" id="lv-emp">${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="lv-date" type="date"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Type</label><select class="form-control" id="lv-type">${Object.entries(LEAVE_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="lv-status"><option value="approved">Approved</option><option value="pending">Pending</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Note (optional)</label><input class="form-control" id="lv-note" placeholder="Add a note"></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveLeave()">Save</button></div>`);
}

function saveLeave() {
    const empId = document.getElementById('lv-emp').value;
    const date = document.getElementById('lv-date').value;
    const type = document.getElementById('lv-type').value;
    const status = document.getElementById('lv-status').value;
    const note = document.getElementById('lv-note').value.trim();
    if (!date) { showToast('Date required', 'error'); return; }
    const leaves = DB.get('leaves');
    leaves.push({ id: 'lv' + Date.now(), empId, date, type, status, note });
    DB.set('leaves', leaves); revalidateAllRosters(); closeModal(); renderLeavesPage(); showToast('Leave saved!', 'success');
}

function approveLeave(id) {
    const leaves = DB.get('leaves'); const idx = leaves.findIndex(l => l.id === id);
    if (idx > -1) leaves[idx].status = 'approved';
    DB.set('leaves', leaves); revalidateAllRosters(); renderLeavesPage(); showToast('Leave approved!', 'success');
}

function deleteLeave(id) {
    DB.set('leaves', DB.get('leaves').filter(l => l.id !== id));
    revalidateAllRosters();
    renderLeavesPage(); showToast('Leave removed', 'info');
}

function showAddHolidayModal() {
    openModal(`<div class="modal-header"><div class="modal-title">Add public holiday</div><button type="button" class="modal-close" aria-label="Close dialog" onclick="closeModal()">×</button></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Date</label><input class="form-control" id="ph-date" type="date"></div>
      <div class="form-group"><label class="form-label">Holiday Name</label><input class="form-control" id="ph-name" placeholder="Diwali"></div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveHoliday()">Save</button></div>`);
}

function saveHoliday() {
    const date = document.getElementById('ph-date').value;
    const name = document.getElementById('ph-name').value.trim();
    if (!date || !name) { showToast('Date and name required', 'error'); return; }
    const holidays = DB.get('publicHolidays');
    holidays.push({ id: 'ph' + Date.now(), date, name });
    DB.set('publicHolidays', holidays); revalidateAllRosters(); closeModal(); renderLeavesPage(); showToast('Holiday added!', 'success');
}

function deleteHoliday(id) {
    DB.set('publicHolidays', DB.get('publicHolidays').filter(h => h.id !== id));
    revalidateAllRosters();
    renderLeavesPage(); showToast('Holiday removed', 'info');
}

// ---- CONFLICTS PAGE ----
function renderConflictsPage() {
    const rosters = DB.getObj('rosters');
    const employees = DB.get('employees');
    const brands = DB.get('brands');

    let allConflicts = [];
    Object.entries(rosters).forEach(([key, r]) => {
        (r.conflicts || []).forEach(c => allConflicts.push({ ...c, rosterKey: key }));
    });

    document.getElementById('page-content').innerHTML = `
<div class="fade-in">
  ${allConflicts.length === 0
            ? `<div class="empty-state"><div class="empty-title">No roster issues</div><div class="empty-sub">Coverage gaps and shift overlaps will appear here after you create a roster.</div><button class="btn btn-primary mt-3" onclick="navigate('roster')">Open roster</button></div>`
            : `<div class="alert alert-warning mb-3"><b>${allConflicts.length} issue${allConflicts.length !== 1 ? 's' : ''}</b> across saved rosters. Review coverage gaps and overlapping shifts.</div>
  ${allConflicts.map(c => {
                const [y, m] = c.rosterKey.split('-').map(Number);
                const suggestions = c.type === 'coverage-gap'
                    ? Scheduler.getSuggestedBackups(c.brandId, c.processId, c.date, (c.assignedEmployees || []))
                    : [];
                return `<div class="conflict-item">
      <div class="conflict-icon" aria-hidden="true">!</div>
      <div class="conflict-content">
        <div class="conflict-title">${c.brandName} — ${c.processName}</div>
        <div class="conflict-detail">${c.message}</div>
        <div class="conflict-date">${fmtDate(c.date)} &bull; ${MONTH_NAMES[m]} ${y} roster</div>
        ${c.offEmployees && c.offEmployees.length > 0 ? `<div style="font-size:11px;color:var(--text-secondary);margin-top:4px">Unavailable: ${c.offEmployees.join(' | ')}</div>` : ''}
        ${suggestions.length > 0 ? `<div style="margin-top:8px">
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:6px">Suggested backups</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${suggestions.map(s => `<span class="badge badge-info">${s.empName}</span>`).join('')}</div>
        </div>`: ''}
        <div class="conflict-actions">
          <button class="btn btn-xs btn-secondary" onclick="loadRoster('${c.rosterKey}')">View Roster</button>
        </div>
      </div>
    </div>`;
            }).join('')}`}
</div>`;
}

// ---- SETTINGS PAGE ----
function renderSettingsPage() {
    document.getElementById('page-content').innerHTML = `
<div class="fade-in">
  <div class="grid-2">
    <div class="card">
      <div class="card-header"><div><div class="card-title">Your data</div><div class="card-subtitle">Export a copy or restore the sample workspace.</div></div></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-danger" onclick="if(confirm('Replace all saved data with the sample data? This cannot be undone.')){DB.reset();updateConflictBadge();showToast('Sample data restored','info');navigate('dashboard');}">Restore sample data</button>
        <button class="btn btn-secondary" onclick="exportAllData()">Export data (JSON)</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div><div class="card-title">Roster rules</div><div class="card-subtitle">How the schedule is checked.</div></div></div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.8">
        <b>Working days</b><br>
        365 days: Work every day, including Sundays and holidays.<br>
        No holidays: Work Sundays; public holidays are off.<br>
        No Sundays or holidays: Both are off.<br>
        Custom weekdays: Choose operating days and holiday coverage.<br><br>
        <b>Time off priority</b><br>
        Approved leave, comp-off, weekly day off, then working-day rule.<br><br>
        <b>Staffing</b><br>
        Each brand and process can set a minimum team size, with optional weekday-specific minimums.<br><br>
        <b>Roster checks</b><br>
        Issues are shown when staffing is below the minimum or assigned shifts overlap.
      </div>
    </div>
  </div>
</div>`;
}

function exportAllData() {
    const data = {
        pods: DB.get('pods'), brands: DB.get('brands'), processes: DB.get('processes'),
        employees: DB.get('employees'), assignments: DB.get('assignments'),
        brandProcessRules: DB.get('brandProcessRules'),
        publicHolidays: DB.get('publicHolidays'), leaves: DB.get('leaves'),
        rosters: DB.getObj('rosters'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'roster_data_export.json'; a.click();
    showToast('Data exported!', 'success');
}

// ---- CONFLICT BADGE ----
function updateConflictBadge() {
    const rosters = DB.getObj('rosters');
    let total = 0;
    Object.values(rosters).forEach(r => total += (r.conflicts || []).length);
    const badge = document.getElementById('global-conflict-badge');
    if (badge) { badge.textContent = `${total} roster issue${total === 1 ? '' : 's'}`; badge.classList.toggle('hidden', total === 0); }
}

function revalidateAllRosters() {
    const rosters = DB.getObj('rosters');
    try {
        Object.keys(rosters).forEach(key => Scheduler.revalidateRoster(key));
    } catch (error) {
        showToast(`Saved roster validation failed: ${error.message}`, 'error');
    }
    updateConflictBadge();
}

// ---- INIT ----
function init() {
    initStorage();
    navigate('dashboard');
    updateConflictBadge();
}

window.addEventListener('DOMContentLoaded', init);
