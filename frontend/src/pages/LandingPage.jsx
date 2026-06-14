import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import landingImage from "../images/landing-image.png";
import trombiFlowLogo from "../images/LOGO_TROMBIFLOW.png";
import cameraIcon from "../images/camera_icone.png";
import importCsvIcon from "../images/importcsv-icone.png";
import printerIcon from "../images/imprimante-icone.png";
import rgpdIcon from "../images/rgpd-icone.png";

const FEATURES = [
  {
    id: 1,
    icon: cameraIcon,
    title: "Photos prêtes",
    text: "Des profils nets, rangés par classe, avec aperçu immédiat.",
  },
  {
    id: 2,
    icon: importCsvIcon,
    title: "Import précis",
    text: "Ajout CSV, contrôles visibles et données propres avant export.",
  },
  {
    id: 3,
    icon: printerIcon,
    title: "Exports soignés",
    text: "PDF et HTML prêts pour l'impression ou le partage interne.",
  },
  {
    id: 4,
    icon: rgpdIcon,
    title: "Accès sécurisé",
    text: "Un espace réservé aux équipes, pensé pour les données scolaires.",
  },
];

const WORKFLOW = [
  { id: "01", title: "Organiser", text: "Créez les classes et gardez l'année scolaire claire." },
  { id: "02", title: "Centraliser", text: "Ajoutez les étudiants, emails et photos au même endroit." },
  { id: "03", title: "Composer", text: "Prévisualisez le rendu classe par classe sans perdre le fil." },
  { id: "04", title: "Exporter", text: "Générez un trombinoscope propre en quelques secondes." },
];

const SPOTLIGHTS = [
  "Vue par classe",
  "Photos uniformisées",
  "Historique des exports",
  "Gestion rapide",
];

const COMPARISON = [
  {
    label: "Avant",
    title: "Des fichiers dispersés",
    items: [
      "Photos envoyées par plusieurs canaux",
      "CSV à corriger à la main",
      "Mises en page à refaire pour chaque classe",
    ],
  },
  {
    label: "Avec TrombiFlow",
    title: "Un flux clair et centralisé",
    items: [
      "Classes, étudiants et photos au même endroit",
      "Contrôles visibles avant export",
      "Trombinoscopes prêts à partager ou imprimer",
    ],
  },
];

const SECURITY_POINTS = [
  { value: "Accès", label: "Comptes réservés aux utilisateurs autorisés" },
  { value: "Données", label: "Informations scolaires centralisées dans un espace interne" },
  { value: "Exports", label: "PDF et HTML générés depuis une base propre" },
];

const FAQS = [
  {
    question: "Qui peut utiliser TrombiFlow ?",
    answer: "La plateforme est pensée pour les équipes qui gèrent les classes, les étudiants et les exports de trombinoscopes.",
  },
  {
    question: "Peut-on importer un fichier CSV ?",
    answer: "Oui, l'objectif est de gagner du temps avec un import structuré, puis de vérifier les données avant l'export.",
  },
  {
    question: "Les photos sont-elles obligatoires ?",
    answer: "Non, elles améliorent le rendu du trombinoscope, mais la base peut rester exploitable même si certains profils sont incomplets.",
  },
  {
    question: "Peut-on exporter le trombinoscope ?",
    answer: "Oui, TrombiFlow prévoit des exports propres pour l'impression ou le partage interne.",
  },
];

export default function LandingPage({ classCount = 0, onEnter, onLogin, onRegister, toast }) {
  const stats = [
    { value: String(classCount).padStart(2, "0"), label: classCount > 1 ? "classes actives" : "classe active" },
    { value: "PDF", label: "export imprimable" },
    { value: "RGPD", label: "accès contrôlé" },
  ];

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
  const [activeFaq, setActiveFaq] = useState(0);

  const openLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const openRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };


  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast?.("Merci de renseigner email et mot de passe", "error");
      return;
    }

    try {
      await onLogin?.(loginForm);
      toast?.("Connexion réussie");
      setShowLogin(false);
      onEnter?.();
    } catch (error) {
      toast?.(error.message, "error");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast?.("Merci de remplir tous les champs", "error");
      return;
    }

    try {
      await onRegister?.(registerForm);
      toast?.("Compte créé");
      setShowRegister(false);
      onEnter?.();
    } catch (error) {
      toast?.(error.message, "error");
    }
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
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-shell" id="top">
      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="Accueil TrombiFlow">
          <img className="landing-brand-logo" src={trombiFlowLogo} alt="" aria-hidden="true" />
          <div className="landing-brand-text">
            <div className="landing-brand-title">Trombi<span>Flow</span></div>
          
          </div>
        </a>
        <nav className="landing-nav-links">
          <a className="link-underline" href="#features">Fonctionnalités</a>
          <a className="link-underline" href="#workflow">Workflow</a>
          <a className="link-underline" href="#security">Sécurité</a>
          <a className="link-underline" href="#contact">Contact</a>
        </nav>
        <div className="landing-nav-actions">
          <button className="btn btn-secondary" type="button" onClick={openLogin}>Connexion</button>
          <button className="btn btn-primary" type="button" onClick={openRegister}>S'inscrire</button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <img className="landing-hero-bg" src={landingImage} alt="" aria-hidden="true" />
          <div className="landing-hero-grid" aria-hidden="true" />
          <div className="landing-hero-shine" aria-hidden="true" />

          <div className="landing-hero-content">
            <div className="landing-kicker">Plateforme interne ESIEE-IT</div>
            <h1 className="landing-hero-title">
              <img className="landing-hero-logo" src={trombiFlowLogo} alt="" aria-hidden="true" />
              <span className="brand-wordmark">Trombi<span className="brand-accent">Flow</span></span>
            </h1>
            <p className="landing-hero-sub">
              Le cockpit élégant pour centraliser les classes, les étudiants et les photos,
              puis produire des trombinoscopes impeccables sans friction.
            </p>
            <div className="landing-hero-actions">
              <button className="btn btn-primary" type="button" onClick={openRegister}>S'inscrire</button>
              <button className="btn btn-secondary" type="button" onClick={onEnter}>Découvrir le tableau de bord</button>
            </div>
          </div>

          <div className="landing-hero-console" aria-label="Aperçu de l'activité TrombiFlow">
            <div className="landing-console-top">
              <span>Trombinoscope 2026</span>
              <span className="landing-live-dot">Live</span>
            </div>
            <div className="landing-console-stage">
              {SPOTLIGHTS.map((label, index) => (
                <span key={label} style={{ "--spot-delay": `${index * 650}ms` }}>
                  {label}
                </span>
              ))}
            </div>
            <div className="landing-console-stats">
              {stats.map((stat) => (
                <div className="landing-console-stat" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-marquee" aria-label="Capacités principales">
          <div className="landing-marquee-track">
            {[...SPOTLIGHTS, ...SPOTLIGHTS].map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
        </section>

        <section className="landing-features" id="features">
          <div className="landing-section-head reveal">
            <span className="landing-section-eyebrow">Pensé pour les écoles</span>
            <h2 className="landing-section-title">Un espace simple, mais très propre.</h2>
            <p className="landing-section-sub">
              Chaque action importante reste rapide, lisible et prête pour un vrai usage pédagogique.
            </p>
          </div>

          <div className="landing-feature-grid">
            {FEATURES.map((feature, idx) => (
              <article
                className="landing-feature-card reveal"
                key={feature.id}
                style={{ "--reveal-delay": `${idx * 80}ms` }}
              >
                <img className="landing-feature-icon" src={feature.icon} alt="" aria-hidden="true" />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-workflow" id="workflow">
          <div className="landing-section-head reveal">
            <span className="landing-section-eyebrow">Workflow</span>
            <h2 className="landing-section-title">Du fichier brut au trombinoscope final.</h2>
            <p className="landing-section-sub">
              Le parcours reste clair, même quand les classes et les photos se multiplient.
            </p>
          </div>

          <div className="landing-workflow-rail">
            {WORKFLOW.map((step, idx) => (
              <article
                className="landing-workflow-step reveal"
                key={step.id}
                style={{ "--reveal-delay": `${idx * 90}ms` }}
              >
                <span className="landing-workflow-index">{step.id}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-comparison" id="comparison">
          <div className="landing-section-head reveal">
            <span className="landing-section-eyebrow">Avant / Après</span>
            <h2 className="landing-section-title">Moins de bricolage, plus de fluidité.</h2>
            <p className="landing-section-sub">
              TrombiFlow transforme une gestion dispersée en un parcours propre, contrôlé et rapide.
            </p>
          </div>

          <div className="landing-comparison-grid">
            {COMPARISON.map((column, idx) => (
              <article
                className={`landing-comparison-card ${idx === 1 ? "is-after" : ""} reveal`}
                key={column.label}
                style={{ "--reveal-delay": `${idx * 110}ms` }}
              >
                <span>{column.label}</span>
                <h3>{column.title}</h3>
                <ul>
                  {column.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-security" id="security">
          <div className="landing-security-inner">
            <div className="landing-section-head reveal">
              <span className="landing-section-eyebrow">Sécurité & confidentialité</span>
              <h2 className="landing-section-title">Un projet pensé pour des données sensibles.</h2>
              <p className="landing-section-sub">
                Les informations étudiantes restent lisibles, organisées et limitées à un usage interne.
              </p>
            </div>

            <div className="landing-security-grid">
              {SECURITY_POINTS.map((point, idx) => (
                <article
                  className="landing-security-item reveal"
                  key={point.value}
                  style={{ "--reveal-delay": `${idx * 90}ms` }}
                >
                  <strong>{point.value}</strong>
                  <p>{point.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-faq" id="faq">
          <div className="landing-section-head reveal">
            <span className="landing-section-eyebrow">FAQ</span>
            <h2 className="landing-section-title">Les questions avant de commencer.</h2>
          </div>

          <div className="landing-faq-list">
            {FAQS.map((item, idx) => {
              const isOpen = activeFaq === idx;

              return (
                <article
                  className={`landing-faq-item ${isOpen ? "is-open" : ""}`}
                  key={item.question}
                >
                  <button
                    className="landing-faq-question"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`landing-faq-panel-${idx}`}
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                  >
                    <span>{item.question}</span>
                    <span className="landing-faq-icon" aria-hidden="true" />
                  </button>
                  <div
                    className="landing-faq-panel"
                    id={`landing-faq-panel-${idx}`}
                    role="region"
                    aria-hidden={!isOpen}
                  >
                    <div className="landing-faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-finale reveal">
          <div className="landing-section-head landing-finale-content">
            <span className="landing-section-eyebrow">Prêt pour la suite</span>
            <h2 className="landing-section-title">Lancez l'espace et remplissez la base depuis le site.</h2>
          </div>
          <div className="landing-finale-actions">
            <button className="btn btn-primary" type="button" onClick={openLogin}>Accéder à l'espace</button>
            <button className="btn btn-blue" type="button" onClick={openRegister}>Créez votre compte TrombiFlow</button>
          </div>
        </section>
      </main>

      <footer className="landing-footer" id="contact">
        <div className="landing-footer-grid">
          <div className="landing-footer-col reveal" style={{ "--reveal-delay": "0ms" }}>
            <div className="landing-footer-title-row">
              <img className="landing-footer-logo" src={trombiFlowLogo} alt="" aria-hidden="true" />
              <div className="landing-footer-title">Trombi<span className="brand-accent">Flow</span> ESIEE-IT</div>
            </div>
            <div className="landing-footer-text">Plateforme interne pour la gestion des classes et des étudiants.</div>
          </div>
          <div className="landing-footer-col reveal" style={{ "--reveal-delay": "90ms" }}>
            <div className="landing-footer-title">Navigation</div>
            <a className="landing-footer-link link-underline" href="#top">Accueil</a>
            <a className="landing-footer-link link-underline" href="#features">Fonctionnalités</a>
            <a className="landing-footer-link link-underline" href="#workflow">Workflow</a>
            <a className="landing-footer-link link-underline" href="#faq">FAQ</a>
          </div>
          <div className="landing-footer-col reveal" style={{ "--reveal-delay": "180ms" }}>
            <div className="landing-footer-title">Contact</div>
            <div className="landing-footer-text">support.trombiflow@esiee-it.fr</div>
            <div className="landing-footer-text">01 23 45 67 89</div>
            <div className="landing-footer-text">Campus ESIEE-IT, Pontoise</div>
          </div>
          <div className="landing-footer-col reveal" style={{ "--reveal-delay": "270ms" }}>
            <div className="landing-footer-title">Accès</div>
            <button className="landing-footer-button" type="button" onClick={openLogin}>Connexion</button>
            <button className="landing-footer-button" type="button" onClick={openRegister}>Créer un compte</button>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span className="landing-footer-brand-line">
            <img className="landing-footer-mini-logo" src={trombiFlowLogo} alt="" aria-hidden="true" />
            Projet pédagogique ESIEE-IT · Trombi<span className="brand-accent">Flow</span> 2026
          </span>
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
            {/* Role removed from signup: new users are teacher by default */}
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
