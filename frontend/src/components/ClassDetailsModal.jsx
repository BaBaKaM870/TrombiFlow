import Icon from "./Icon";
import Modal from "./Modal";

export default function ClassDetailsModal({ classItem, students, onClose, onEdit }) {
  const classStudents = students.filter((student) => student.classId === classItem.id);

  return (
    <Modal
      title="Fiche classe"
      onClose={onClose}
      className="class-details-modal"
      footer={
        <>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Fermer
          </button>
          <button className="btn btn-primary" type="button" onClick={() => onEdit?.(classItem)}>
            <Icon name="edit" /> Modifier
          </button>
        </>
      }
    >
      <div className="class-details">
        <div className="class-details-hero">
          <div className="class-details-mark">{classItem.label?.slice(0, 2)?.toUpperCase() || "CL"}</div>
          <div>
            <div className="class-details-kicker">Classe</div>
            <h2>{classItem.label}</h2>
            <div className="class-details-meta">
              <span className="badge badge-blue">{classItem.year || "Annee non renseignee"}</span>
              <span className="badge badge-coral">{classStudents.length} etudiant{classStudents.length > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        <div className="class-details-grid">
          <div className="class-details-stat">
            <span>Libelle</span>
            <strong>{classItem.label}</strong>
          </div>
          <div className="class-details-stat">
            <span>Annee scolaire</span>
            <strong>{classItem.year || "Non renseignee"}</strong>
          </div>
          <div className="class-details-stat">
            <span>Identifiant</span>
            <strong>#{classItem.id}</strong>
          </div>
        </div>

        <div className="class-students-panel">
          <div className="class-students-head">
            <span>Etudiants de cette classe</span>
            <strong>{classStudents.length}</strong>
          </div>

          <div className="class-students-list">
            {classStudents.map((student) => (
              <div className="class-student-row" key={student.id}>
                <img src={student.photo} alt="" />
                <div className="class-student-main">
                  <div className="class-student-name">{student.firstName} {student.lastName}</div>
                  <div className="class-student-email">{student.email || "Email non renseigne"}</div>
                </div>
                <div className="class-student-id">#{student.id}</div>
              </div>
            ))}

            {classStudents.length === 0 && (
              <div className="class-students-empty">
                Aucun etudiant n'est encore rattache a cette classe.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
