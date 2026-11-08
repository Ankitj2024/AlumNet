# Role-Based Access Control (RBAC) Matrix
## P11 — Verified Alumni Mentorship Platform
**Version:** 1.0.0  

---

## 1. Role Definitions

1. **`STUDENT`**: Currently enrolled student.
2. **`ALUMNI_MENTOR`**: University graduate acting as an approved or pending mentor.
3. **`ALUMNI_RELATIONS_OFFICER`**: Institutional advancement staff managing alumni relations.
4. **`PLACEMENT_OFFICER`**: University career development and placement officer.
5. **`SUPER_ADMIN`**: Institutional IT / platform administrator.

---

## 2. Resource-Level Permission Matrix

| Resource & Operation | `STUDENT` | `ALUMNI_MENTOR` | `ALUMNI_RELATIONS_OFFICER` | `PLACEMENT_OFFICER` | `SUPER_ADMIN` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Authentication & Self Profile** |
| Register & Authenticate | Full | Full | Full | Full | Full |
| Manage Self Profile | Own | Own | Own | Own | Own |
| Enable/Disable Self MFA | Own | Own | Own | Own | Own |
| **Alumni Verification** |
| Submit Verification Request | Denied | Own | Denied | Denied | Denied |
| View Verification Queue | Denied | Denied | Full | Denied | Full |
| Review / Approve / Reject Alumnus | Denied | Denied | Full | Denied | Full |
| Upload Institutional CSV Records | Denied | Denied | Full | Denied | Full |
| View Alumnus Verification Docs | Denied | Own | Full | Denied | Full |
| **Mentor Discovery & Matching** |
| Search Verified Mentors | Filtered (Public DTO) | Filtered (Public DTO) | Full | Read-Only | Full |
| View Mentor Direct Email / Phone | **NEVER** | Own | Verified Records Only | **NEVER** | Authorized Audited |
| View Match Explanations | Own | Denied | Full | Denied | Full |
| **Mentorship Requests** |
| Submit Request (Subject to Throttle) | Yes | Denied | Denied | Denied | Denied |
| Accept / Decline Incoming Request | Denied | Own | Denied | Denied | Denied |
| Cancel Outgoing Request | Own | Denied | Denied | Denied | Denied |
| **Mentorship Workspace** |
| View Mentorship Workspace | Enrolled | Enrolled | Read-Only (Audited) | Denied | Full (Audited) |
| Close Mentorship | Enrolled | Enrolled | Terminate with Notice | Denied | Terminate |
| Propose / Reschedule Sessions | Enrolled | Enrolled | Denied | Denied | Denied |
| Manage Goals & Action Items | Enrolled | Enrolled | Read-Only | Denied | Denied |
| Submit Feedback | Enrolled | Enrolled | Denied | Denied | Denied |
| **Messaging** |
| Connect to Mentorship Chat Room | Enrolled Only | Enrolled Only | Denied | Denied | Denied |
| View Conversation Message History | Enrolled Only | Enrolled Only | Compliance Review Only | Denied | Compliance Review Only |
| **Programme & Capacity Oversight** |
| View Capacity Utilization & Overload | Denied | Own | Full | Aggregated Only | Full |
| Modify Programme Settings / Weights | Denied | Denied | Denied | Denied | Full |
| Trigger Manual Capacity Reconciler | Denied | Denied | Denied | Denied | Full |
| **Analytics & Reporting** |
| Operational Engagement Dashboard | Denied | Denied | Full | Read-Only | Full |
| Placement & Career Outcomes Data | Denied | Denied | Aggregated | Full | Full |
| Export Analytics CSV | Denied | Denied | Sanitized | Sanitized | Full (Sanitized) |
| View System Audit Logs | Denied | Denied | Verification Logs Only | Denied | Full |

---

## 3. Enforcement Mechanisms
1. **Route-Level Guard**: `requireRole(['ALUMNI_RELATIONS_OFFICER', 'SUPER_ADMIN'])`.
2. **Resource Ownership Guard**: `requireResourceOwnership(MentorshipModel, 'id', ['studentId', 'mentorId'])`.
3. **Field-Level Projection Guard**: DTO serializers reject disallowed fields before JSON serialization.

