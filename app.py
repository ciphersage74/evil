import json
import os
import zipfile
from functools import wraps
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    send_file,
    session,
    url_for,
)
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
CONTENT_PATH = BASE_DIR / "content.json"
UPLOAD_FOLDER = BASE_DIR / "static" / "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["UPLOAD_FOLDER"] = str(UPLOAD_FOLDER)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB uploads

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "changeme")


def default_content() -> Dict[str, Any]:
    """Return the default site configuration."""
    return {
        "site": {
            "name": "Café Ernesto",
            "title": "Café Ernesto - Restaurant élégant à Annemasse",
            "meta_description": "Une expérience culinaire raffinée au cœur d'Annemasse.",
        },
        "theme": {
            "primary_color": "#d97706",
            "secondary_color": "#b45309",
            "accent_color": "#fef3c7",
            "background_color": "#f9fafb",
            "text_color": "#1f2937",
            "button_text_color": "#ffffff",
            "heading_font_family": "Playfair Display",
            "heading_font_url": "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap",
            "body_font_family": "Montserrat",
            "body_font_url": "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600&display=swap",
        },
        "navigation": [
            {"label": "Accueil", "target": "#home"},
            {"label": "À propos", "target": "#about"},
            {"label": "Menu", "target": "#menu"},
            {"label": "Horaires", "target": "#hours"},
            {"label": "Contact", "target": "#contact"},
        ],
        "hero": {
            "title": "Café Ernesto",
            "subtitle": "Une expérience culinaire raffinée au cœur d'Annemasse",
            "cta_label": "Découvrir notre menu",
            "cta_link": "#menu",
            "background_image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
        },
        "about": {
            "title": "Notre histoire",
            "paragraphs": [
                "Fondé en 2010, Café Ernesto est rapidement devenu une référence gastronomique à Annemasse. Notre chef, formé dans les meilleures écoles culinaires françaises, vous propose une cuisine inventive tout en respectant les traditions.",
                "Notre établissement allie élégance et convivialité, offrant à nos clients une expérience mémorable dans un cadre chaleureux et raffiné.",
            ],
            "image": "https://images.unsplash.com/photo-1543772829-2e49208e1b6b?auto=format&fit=crop&w=1200&q=80",
            "rating_label": "Note moyenne",
            "rating_value": "4.8/5",
            "rating_subtext": "Basé sur 311 avis",
        },
        "menu": {
            "title": "Notre Menu",
            "description": "Découvrez notre sélection de plats préparés avec des ingrédients frais et locaux.",
            "items": [
                {
                    "title": "Plat du jour",
                    "description": "Notre spécialité changeante selon les saisons et les inspirations du chef.",
                    "price": "15€",
                    "image": "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80",
                },
                {
                    "title": "Salade gourmande",
                    "description": "Mélange de jeunes pousses, noix, fromage de chèvre et vinaigrette maison.",
                    "price": "12€",
                    "image": "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=1200&q=80",
                },
                {
                    "title": "Dessert du moment",
                    "description": "Une création sucrée qui change quotidiennement pour votre plus grand plaisir.",
                    "price": "8€",
                    "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
                },
            ],
            "cta_text": "Voir le menu complet",
            "cta_link": "#",
        },
        "hours": {
            "title": "Nos Horaires",
            "description": "Venez nous rendre visite aux heures d'ouverture suivantes",
            "entries": [
                {"label": "Mardi", "value": "08:00 - 18:00"},
                {"label": "Mercredi", "value": "08:00 - 18:00"},
                {"label": "Jeudi", "value": "08:00 - 18:00"},
                {"label": "Vendredi", "value": "08:00 - 18:00"},
                {"label": "Samedi", "value": "08:00 - 18:00"},
                {"label": "Dimanche & Lundi", "value": "Fermé", "highlight": True},
            ],
        },
        "contact": {
            "title": "Nous Contacter",
            "description": "Pour toute réservation ou information, n'hésitez pas à nous contacter",
            "information": [
                {
                    "icon": "map-pin",
                    "label": "Adresse",
                    "value": "5 Rue de la Gare, 74100 Annemasse, France",
                },
                {
                    "icon": "phone",
                    "label": "Téléphone",
                    "value": "+33 4 50 80 18 78",
                },
                {
                    "icon": "mail",
                    "label": "Email",
                    "value": "contact@cafeernesto.fr",
                },
            ],
            "map_embed_url": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2761.302184009318!2d6.23401531559236!3d46.19413087911542!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x478c64d6b6e8f0a9%3A0x5c2c7a3d0d1b3e5d!2s5%20Rue%20de%20la%20Gare%2C%2074100%20Annemasse%2C%20France!5e0!3m2!1sfr!2sfr!4v1620000000000!5m2!1sfr!2sfr",
        },
        "contact_form": {
            "name_label": "Nom",
            "email_label": "Email",
            "message_label": "Message",
            "button_label": "Envoyer",
        },
        "footer": {
            "description": "Une expérience culinaire raffinée au cœur d'Annemasse.",
            "links": [
                {"label": "Accueil", "target": "#home"},
                {"label": "À propos", "target": "#about"},
                {"label": "Menu", "target": "#menu"},
                {"label": "Horaires", "target": "#hours"},
                {"label": "Contact", "target": "#contact"},
            ],
            "socials": [
                {"icon": "facebook", "url": "#"},
                {"icon": "instagram", "url": "#"},
                {"icon": "twitter", "url": "#"},
            ],
            "copyright": "© 2023 Café Ernesto. Tous droits réservés.",
        },
    }


def ensure_setup() -> None:
    """Ensure that required folders and files exist."""
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    if not CONTENT_PATH.exists():
        save_content(default_content())


def load_content() -> Dict[str, Any]:
    ensure_setup()
    with CONTENT_PATH.open("r", encoding="utf-8") as fp:
        data: Dict[str, Any] = json.load(fp)

    defaults = default_content()
    theme_defaults = defaults.get("theme", {})
    theme = data.setdefault("theme", {})
    for key, value in theme_defaults.items():
        theme.setdefault(key, value)

    return data


def save_content(content: Dict[str, Any]) -> None:
    CONTENT_PATH.write_text(
        json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_image(field_name: str) -> Optional[str]:
    file = request.files.get(field_name)
    if not file or not file.filename:
        return None
    filename = secure_filename(file.filename)
    if not filename:
        raise ValueError("Le nom du fichier est invalide.")
    if not allowed_file(filename):
        raise ValueError("Format de fichier non autorisé. Utilisez png, jpg, jpeg, gif ou webp.")
    ext = Path(filename).suffix.lower()
    new_filename = f"{uuid4().hex}{ext}"
    destination = UPLOAD_FOLDER / new_filename
    file.save(destination)
    return f"/static/uploads/{new_filename}"


def login_required(view):
    @wraps(view)
    def wrapped_view(**kwargs):
        if not session.get("admin_authenticated"):
            return redirect(url_for("login", next=request.path))
        return view(**kwargs)

    return wrapped_view


@app.route("/")
def index():
    content = load_content()
    return render_template("index.html", content=content, export_mode=False)


@app.route("/admin/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session["admin_authenticated"] = True
            flash("Connexion réussie.", "success")
            next_url = request.args.get("next") or url_for("admin")
            return redirect(next_url)
        flash("Identifiants invalides.", "error")
    return render_template("login.html")


@app.route("/admin/logout")
@login_required
def logout():
    session.clear()
    flash("Vous avez été déconnecté.", "success")
    return redirect(url_for("login"))


def parse_list_from_form(prefix: str, fields: List[str], optional_fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    optional_fields = optional_fields or []
    try:
        total = int(request.form.get(f"{prefix}_count", 0))
    except ValueError:
        total = 0
    items: List[Dict[str, Any]] = []
    for index in range(total):
        item: Dict[str, Any] = {}
        keep = False
        for field in fields:
            key = f"{prefix}-{index}-{field}"
            value = request.form.get(key, "").strip()
            if value:
                keep = True
            item[field] = value
        for field in optional_fields:
            key = f"{prefix}-{index}-{field}"
            item[field] = request.form.get(key)
        if keep:
            items.append(item)
    return items


@app.route("/admin", methods=["GET", "POST"])
@login_required
def admin():
    content = load_content()
    if request.method == "POST":
        try:
            updated = update_content_from_form(content)
        except ValueError as exc:
            flash(str(exc), "error")
            return redirect(url_for("admin"))
        save_content(updated)
        flash("Contenu mis à jour avec succès.", "success")
        return redirect(url_for("admin"))
    return render_template("admin.html", content=content)


def update_content_from_form(content: Dict[str, Any]) -> Dict[str, Any]:
    updated = json.loads(json.dumps(content))

    updated["site"]["name"] = request.form.get("site_name", "").strip()
    updated["site"]["title"] = request.form.get("site_title", "").strip()
    updated["site"]["meta_description"] = request.form.get("site_meta_description", "").strip()

    theme = updated.setdefault("theme", {})
    theme["primary_color"] = request.form.get("theme_primary_color", theme.get("primary_color", "")).strip()
    theme["secondary_color"] = request.form.get("theme_secondary_color", theme.get("secondary_color", "")).strip()
    theme["accent_color"] = request.form.get("theme_accent_color", theme.get("accent_color", "")).strip()
    theme["background_color"] = request.form.get("theme_background_color", theme.get("background_color", "")).strip()
    theme["text_color"] = request.form.get("theme_text_color", theme.get("text_color", "")).strip()
    theme["button_text_color"] = request.form.get("theme_button_text_color", theme.get("button_text_color", "")).strip()
    theme["heading_font_family"] = request.form.get("theme_heading_font_family", theme.get("heading_font_family", "")).strip()
    theme["heading_font_url"] = request.form.get("theme_heading_font_url", theme.get("heading_font_url", "")).strip()
    theme["body_font_family"] = request.form.get("theme_body_font_family", theme.get("body_font_family", "")).strip()
    theme["body_font_url"] = request.form.get("theme_body_font_url", theme.get("body_font_url", "")).strip()

    updated["navigation"] = parse_list_from_form("navigation", ["label", "target"])

    updated["hero"]["title"] = request.form.get("hero_title", "").strip()
    updated["hero"]["subtitle"] = request.form.get("hero_subtitle", "").strip()
    updated["hero"]["cta_label"] = request.form.get("hero_cta_label", "").strip()
    updated["hero"]["cta_link"] = request.form.get("hero_cta_link", "").strip()
    hero_image = save_uploaded_image("hero_background_image")
    if hero_image:
        updated["hero"]["background_image"] = hero_image

    updated["about"]["title"] = request.form.get("about_title", "").strip()
    paragraphs = [
        paragraph.strip()
        for paragraph in request.form.get("about_paragraphs", "").splitlines()
        if paragraph.strip()
    ]
    updated["about"]["paragraphs"] = paragraphs
    updated["about"]["rating_label"] = request.form.get("about_rating_label", "").strip()
    updated["about"]["rating_value"] = request.form.get("about_rating_value", "").strip()
    updated["about"]["rating_subtext"] = request.form.get("about_rating_subtext", "").strip()
    about_image = save_uploaded_image("about_image")
    if about_image:
        updated["about"]["image"] = about_image

    updated["menu"]["title"] = request.form.get("menu_title", "").strip()
    updated["menu"]["description"] = request.form.get("menu_description", "").strip()
    updated["menu"]["cta_text"] = request.form.get("menu_cta_text", "").strip()
    updated["menu"]["cta_link"] = request.form.get("menu_cta_link", "").strip()

    try:
        total_menu_items = int(request.form.get("menu_items_count", 0))
    except ValueError:
        total_menu_items = 0
    menu_items: List[Dict[str, Any]] = []
    for index in range(total_menu_items):
        title = request.form.get(f"menu_items-{index}-title", "").strip()
        description = request.form.get(f"menu_items-{index}-description", "").strip()
        price = request.form.get(f"menu_items-{index}-price", "").strip()
        existing_image = request.form.get(f"menu_items-{index}-existing_image", "").strip()
        image_field_name = f"menu_items-{index}-image"
        new_image = save_uploaded_image(image_field_name)
        image = new_image or existing_image
        if title or description or price or image:
            menu_items.append(
                {
                    "title": title,
                    "description": description,
                    "price": price,
                    "image": image,
                }
            )
    updated["menu"]["items"] = menu_items

    updated["hours"]["title"] = request.form.get("hours_title", "").strip()
    updated["hours"]["description"] = request.form.get("hours_description", "").strip()

    try:
        total_hours = int(request.form.get("hours_entries_count", 0))
    except ValueError:
        total_hours = 0
    hours_entries: List[Dict[str, Any]] = []
    for index in range(total_hours):
        label = request.form.get(f"hours_entries-{index}-label", "").strip()
        value = request.form.get(f"hours_entries-{index}-value", "").strip()
        highlight = request.form.get(f"hours_entries-{index}-highlight") == "on"
        if label or value:
            entry = {"label": label, "value": value}
            if highlight:
                entry["highlight"] = True
            hours_entries.append(entry)
    updated["hours"]["entries"] = hours_entries

    updated["contact"]["title"] = request.form.get("contact_title", "").strip()
    updated["contact"]["description"] = request.form.get("contact_description", "").strip()
    updated["contact"]["map_embed_url"] = request.form.get("contact_map_embed_url", "").strip()
    try:
        total_contact = int(request.form.get("contact_information_count", 0))
    except ValueError:
        total_contact = 0
    contact_information: List[Dict[str, Any]] = []
    for index in range(total_contact):
        icon = request.form.get(f"contact_information-{index}-icon", "").strip()
        label = request.form.get(f"contact_information-{index}-label", "").strip()
        value = request.form.get(f"contact_information-{index}-value", "").strip()
        if label or value:
            contact_information.append({"icon": icon or "info", "label": label, "value": value})
    updated["contact"]["information"] = contact_information

    updated["contact_form"]["name_label"] = request.form.get("contact_form_name_label", "").strip()
    updated["contact_form"]["email_label"] = request.form.get("contact_form_email_label", "").strip()
    updated["contact_form"]["message_label"] = request.form.get("contact_form_message_label", "").strip()
    updated["contact_form"]["button_label"] = request.form.get("contact_form_button_label", "").strip()

    updated["footer"]["description"] = request.form.get("footer_description", "").strip()
    updated["footer"]["copyright"] = request.form.get("footer_copyright", "").strip()

    updated["footer"]["links"] = parse_list_from_form("footer_links", ["label", "target"])
    updated["footer"]["socials"] = parse_list_from_form("footer_socials", ["icon", "url"])

    return updated


def slugify(value: str) -> str:
    """Create a filesystem-friendly slug."""

    value = (value or "").lower()
    normalized: List[str] = []
    for char in value:
        if char.isalnum():
            normalized.append(char)
        elif char in {" ", "-", "_", "/"}:
            if not normalized or normalized[-1] != "-":
                normalized.append("-")
    slug = "".join(normalized).strip("-")
    return slug or "site-web"


def prepare_export_content(content: Dict[str, Any]) -> Dict[str, Any]:
    """Return a deep copy of the content with static paths adjusted for export."""

    def transform(value: Any) -> Any:
        if isinstance(value, dict):
            return {key: transform(val) for key, val in value.items()}
        if isinstance(value, list):
            return [transform(item) for item in value]
        if isinstance(value, str) and value.startswith("/static/"):
            return value.lstrip("/")
        return value

    return transform(json.loads(json.dumps(content)))


@app.route("/admin/export", methods=["POST"])
@login_required
def export_site():
    content = load_content()
    export_content = prepare_export_content(content)
    rendered = render_template("index.html", content=export_content, export_mode=True)

    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("index.html", rendered)
        archive.writestr(
            "content.json",
            json.dumps(export_content, ensure_ascii=False, indent=2),
        )

        static_folder = BASE_DIR / "static"
        if static_folder.exists():
            has_files = False
            for path in static_folder.rglob("*"):
                if path.is_file():
                    archive.write(
                        path,
                        Path("static") / path.relative_to(static_folder),
                    )
                    has_files = True
            uploads_dir = static_folder / "uploads"
            if uploads_dir.exists() and not any(uploads_dir.iterdir()):
                archive.writestr("static/uploads/.keep", "")
            if not has_files and not uploads_dir.exists():
                archive.writestr("static/uploads/.keep", "")
        else:
            archive.writestr("static/uploads/.keep", "")

    buffer.seek(0)
    filename = f"{slugify(content['site'].get('name', ''))}-site.zip"
    return send_file(
        buffer,
        as_attachment=True,
        download_name=filename,
        mimetype="application/zip",
    )


ensure_setup()


if __name__ == "__main__":
    app.run(debug=True)
