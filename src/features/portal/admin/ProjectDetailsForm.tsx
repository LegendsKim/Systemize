import { updateProjectDetails } from "./actions";

interface ProjectDetailsFormProps {
  readonly projectId: string;
  readonly companyName: string;
  readonly projectName: string;
  readonly idempotencyKey: string;
}

export function ProjectDetailsForm({
  projectId,
  companyName,
  projectName,
  idempotencyKey,
}: ProjectDetailsFormProps) {
  return (
    <form action={updateProjectDetails} className="admin-form">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className="admin-field">
        <label htmlFor="company-name">שם החברה</label>
        <input
          id="company-name"
          name="companyName"
          defaultValue={companyName}
          minLength={2}
          maxLength={160}
          required
        />
      </div>
      <div className="admin-field">
        <label htmlFor="project-name">שם הפרויקט</label>
        <input
          id="project-name"
          name="projectName"
          defaultValue={projectName}
          minLength={2}
          maxLength={160}
          required
        />
      </div>
      <div className="admin-form-actions">
        <button type="submit" className="admin-button">
          שמירת הפרטים
        </button>
      </div>
    </form>
  );
}
