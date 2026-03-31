import TrombiGenerator from "../components/TrombiGenerator";

export default function GeneratePage({ classes, students, setExports, toast }) {
  return (
    <div className="page">
      <div className="generate-hero">
        <div className="hero-title">Générer un <span>trombinoscope</span></div>
        <p className="hero-sub">Créez un trombinoscope HTML ou PDF en quelques secondes pour n'importe quelle classe.</p>
      </div>

      <TrombiGenerator classes={classes} students={students} setExports={setExports} toast={toast} />
    </div>
  );
}
