import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import esieeLogo from "../images/logo-esiee-it.png";
import landingImage from "../images/landing-image.png";
import cameraIcon from "../images/camera_icone.png";
import importCsvIcon from "../images/importcsv-icone.png";
import printerIcon from "../images/imprimante-icone.png";
import rgpdIcon from "../images/rgpd-icone.png";

const FEATURES = [
  {
    id: 1,
    icon: cameraIcon,
    title: "Photos nettes",
    text: "Upload automatique, redimensionnement et apercu en grille.",
  },
  {
    id: 2,
    icon: importCsvIcon,
    title: "Import CSV",
    text: "Ajout rapide d'élèves, contrôle des erreurs et résumé clair.",
  },
  {
    id: 3,
    icon: printerIcon,
    title: "Exports propres",
    text: "Trombinoscopes HTML ou PDF prêts à imprimer.",
  },
  {
    id: 4,
    icon: rgpdIcon,
    title: "RGPD et sécurité",
    text: "Accès réservé, données scolaires protégées.",
  },
];

const HOW_IT_WORKS = [
  {
    id: 1,
    title: "Créez vos classes",
    text: "Ajoutez les classes, années et sections en quelques clics.",
  },
  {
    id: 2,
    title: "Ajoutez vos élèves",
    text: "Import CSV ou ajout manuel, photos et emails centralisés.",
  },
  {
    id: 3,
    title: "Générez le trombinoscope",
    text: "Choisissez le format HTML ou PDF et exportez en un instant.",
  },
];

export default function LandingPage({ onEnter, toast }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    photo: null,
  });
  const [registerPhotoPreview, setRegisterPhotoPreview] = useState("");

  const openLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const openRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast?.("Merci de renseigner email et mot de passe", "error");
      return;
    }
    toast?.("Connexion simulée \u2713");
    setShowLogin(false);
    onEnter?.();
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast?.("Merci de remplir tous les champs", "error");
      return;
    }
    toast?.("Compte créé (simulation) \u2713");
    setShowRegister(false);
    onEnter?.();
  };

  useEffect(() => {
    if (!registerForm.photo) {
      setRegisterPhotoPreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(registerForm.photo);
    setRegisterPhotoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [registerForm.photo]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll(".reveal"));
    if (elements.length === 0) {
      return undefined;
    }

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-shell" id="top">
      <header className="landing-nav">
        <div className="landing-brand">
          <div className="landing-brand-title">Trombi<span>scope</span></div>
          <div className="landing-logo-wrap">
            {/* <img className="landing-logo" src={esieeLogo} alt="ESIEE-IT" /> */}
          </div>
        </div>
        <nav className="landing-nav-links">
          <a className="link-underline" href="#features">Fonctionnalités</a>
          <a className="link-underline" href="#how-it-works">Comment ça marche</a>
          <a className="link-underline" href="#contact">Contact</a>
        </nav>
        <div className="landing-nav-actions">
          <button className="btn btn-secondary" type="button" onClick={openLogin}>Connexion</button>
          <button className="btn btn-primary" type="button" onClick={openRegister}>S'inscrire</button>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-badge">Plateforme interne</span>
          <h1 className="landing-hero-title">
            Bienvenue dans le trombinoscope de l'<span>ESIEE-IT</span>
          </h1>
          <p className="landing-hero-sub">
            Centralisez classes, élèves et photos en un seul espace.
            Générez vos trombinoscopes en quelques secondes, sans stress.
          </p>
          <div className="landing-hero-actions">
            <button className="btn btn-primary" type="button" onClick={openRegister}>S'inscrire</button>
            <button className="btn btn-secondary" type="button" onClick={onEnter}>Découvrir le tableau de bord</button>
          </div>
          <div className="landing-hero-meta">
            <span className="landing-meta-chip motion-ripple">Accès sécurisé</span>
            <span className="landing-meta-chip motion-ripple">RGPD</span>
            <span className="landing-meta-chip motion-ripple">Gestion simple</span>
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="landing-preview-card motion-elevate">
            <div className="landing-preview-header">
              <div>
                <div className="landing-preview-title">Centralisez, gérez, imprimez</div>
                <div className="landing-preview-sub">Classes · Élèves · Exports</div>
              </div>
              <span className="badge badge-coral">2025-2026</span>
            </div>

            <div className="landing-preview-image-wrap">
              <img className="landing-preview-image" src={landingImage} alt="Aperçu du trombinoscope" />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-head reveal" style={{ "--reveal-delay": "0ms" }}>
          <div>
            <div className="landing-section-title">Pensé pour les écoles</div>
            <div className="landing-section-sub">Des outils simples pour des trombinoscopes impeccables.</div>
          </div>
        </div>
        {FEATURES.map((f, idx) => (
          <div
            className="landing-feature-card reveal motion-elevate"
            key={f.id}
            style={{ "--reveal-delay": `${idx * 90}ms` }}
          >
            <img className="landing-feature-icon" src={f.icon} alt={f.title} />
            <div className="landing-feature-title">{f.title}</div>
            <div className="landing-feature-text">{f.text}</div>
          </div>
        ))}
      </section>

      <section className="landing-how" id="how-it-works">
        <div className="landing-section-head reveal" style={{ "--reveal-delay": "0ms" }}>
          <div>
            <div className="landing-section-title">Comment ça marche</div>
            <div className="landing-section-sub">Un flux clair pour centraliser et exporter en sécurité.</div>
          </div>
        </div>
        <div className="landing-how-grid">
          {HOW_IT_WORKS.map((step, idx) => (
            <div
              className="landing-how-card reveal motion-elevate"
              key={step.id}
              style={{ "--reveal-delay": `${idx * 90}ms` }}
            >
              <div className="landing-how-index">0{idx + 1}</div>
              <div className="landing-how-title">{step.title}</div>
              <div className="landing-how-text">{step.text}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer" id="contact">
        <div className="landing-footer-grid">
          <div className="landing-footer-col reveal" style={{ "--reveal-delay": "0ms" }}>
            <div className="landing-footer-title-row">
              <div className="landing-footer-logo-wrap">
                <img className="landing-footer-logo" src={esieeLogo} alt="ESIEE-IT" />
              </div>
              <div className="landing-footer-title">Trombinoscope ESIEE-IT</div>
            </div>
            <div className="landing-footer-text">Plateforme interne pour la gestion des classes et des élèves.</div>
          </div>
          <div className="landing-footer-col reveal" style={{ "--reveal-delay": "90ms" }}>
            <div className="landing-footer-title">Navigation</div>
            <a className="landing-footer-link link-underline" href="#top">Accueil</a>
            <a className="landing-footer-link link-underline" href="#features">Fonctionnalités</a>
            <a className="landing-footer-link link-underline" href="#how-it-works">Comment ça marche</a>
          </div>
          <div className="landing-footer-col reveal" style={{ "--reveal-delay": "180ms" }}>
            <div className="landing-footer-title">Contact</div>
            <div className="landing-footer-text">support.trombiflow@esiee-it.fr</div>
            <div className="landing-footer-text">01 23 45 67 89</div>
            <div className="landing-footer-text">Campus ESIEE-IT, Pontoise</div>
          </div>
          <div className="landing-footer-col reveal" style={{ "--reveal-delay": "270ms" }}>
            <div className="landing-footer-title">Aide</div>
            <a className="landing-footer-link link-underline" href="#how-it-works">Guide rapide</a>
            <a className="landing-footer-link link-underline" href="#contact">Support</a>
            <a className="landing-footer-link link-underline" href="mailto:support.trombiflow@esiee-it.fr">Envoyer un email</a>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>Projet pédagogique ESIEE-IT · TrombiFlow 2026</span>
          <span>Données internes uniquement</span>
        </div>
      </footer>

      {showLogin && (
        <Modal
          title="Connexion"
          onClose={() => setShowLogin(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowLogin(false)}>Annuler</button>
              <button className="btn btn-primary" type="submit" form="login-form">Se connecter</button>
            </>
          }
        >
          <form id="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="prenom.nom@esiee-it.fr"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                className="form-input"
                type="password"
                placeholder="********"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}

      {showRegister && (
        <Modal
          title="Inscription"
          onClose={() => setShowRegister(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowRegister(false)}>Annuler</button>
              <button className="btn btn-primary" type="submit" form="register-form">Créer le compte</button>
            </>
          }
        >
          <form id="register-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input
                className="form-input"
                placeholder="Marie Dupont"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="marie.dupont@esiee-it.fr"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Photo (optionnel)</label>
              <input
                className="form-input"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    photo: e.target.files?.[0] ?? null,
                  })
                }
              />
              {registerPhotoPreview && (
                <div className="form-image-preview">
                  <img
                    className="form-image-thumb"
                    src={registerPhotoPreview}
                    alt="Aperçu de la photo"
                  />
                  <span className="form-image-caption">Aperçu chargé</span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                className="form-input"
                type="password"
                placeholder="********"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
