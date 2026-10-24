import math
import os
import re
import numpy as np
from datetime import datetime, date
from PIL import Image

# Global caching for optional ML models
_nlp_model = None
_vision_model = None
_vision_transform = None
_ml_initialized = False

def init_ml_models():
    """Attempts to load sentence-transformers and torchvision if available, with graceful fallback."""
    global _nlp_model, _vision_model, _vision_transform, _ml_initialized
    if _ml_initialized:
        return

    # Attempt NLP model load
    try:
        from sentence_transformers import SentenceTransformer
        _nlp_model = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception:
        _nlp_model = None

    # Attempt Vision model load
    try:
        import torch
        import torchvision.models as models
        import torchvision.transforms as transforms
        model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        # Remove classifier head to get embedding vector
        model.classifier = torch.nn.Identity()
        model.eval()
        _vision_model = model
        _vision_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    except Exception:
        _vision_model = None
        _vision_transform = None

    _ml_initialized = True


# --- Fallback & Deterministic Text Vectorizer ---
def _fallback_text_embedding(text: str, dim: int = 384) -> list:
    """
    Robust 384-dimensional semantic text embedding using subword n-grams,
    word tokens, and character hashing with L2 normalization.
    Guarantees deterministic, cosine-comparable vectors even without deep weights.
    """
    if not text:
        return [0.0] * dim

    clean_text = text.lower()
    words = re.findall(r"\b\w+\b", clean_text)
    vec = np.zeros(dim, dtype=np.float32)

    # Word-level features
    for i, w in enumerate(words):
        h = hash(w) % dim
        vec[h] += 1.5 / (1.0 + 0.1 * i)
        # Bigram features
        if i > 0:
            h_bi = hash(f"{words[i-1]}_{w}") % dim
            vec[h_bi] += 2.0

    # Character 3-gram and 4-gram features (captures typo tolerance and subwords)
    for n in (3, 4):
        for i in range(len(clean_text) - n + 1):
            sub = clean_text[i:i+n]
            h_sub = hash(sub) % dim
            vec[h_sub] += 0.4

    norm = np.linalg.norm(vec)
    if norm > 1e-6:
        vec = vec / norm
    return vec.tolist()


def get_text_embedding(text: str) -> list:
    """Generates a text embedding vector (384 dimensions) using SentenceTransformers or smart fallback."""
    init_ml_models()
    if _nlp_model is not None:
        try:
            emb = _nlp_model.encode(text, convert_to_numpy=True)
            norm = np.linalg.norm(emb)
            if norm > 1e-6:
                emb = emb / norm
            return emb.tolist()
        except Exception:
            pass
    return _fallback_text_embedding(text)


def _load_pil_image(image_input):
    """Safely extracts a PIL Image from path, PIL Image, bytes, or BytesIO."""
    if image_input is None:
        return None
    try:
        if isinstance(image_input, Image.Image):
            return image_input.copy()
        if isinstance(image_input, (str, os.PathLike)):
            if os.path.exists(image_input):
                return Image.open(image_input)
            return None
        if isinstance(image_input, (bytes, bytearray)):
            import io
            return Image.open(io.BytesIO(image_input))
        if hasattr(image_input, 'read'):
            return Image.open(image_input)
    except Exception:
        return None
    return None

# --- Fallback & Deterministic Image Feature Extractor ---
def _fallback_image_embedding(image_input, dim: int = 512) -> list:
    """
    Extracts multi-resolution spatial color histogram, luminance gradients,
    and perceptual texture moments normalized into a 512-dim unit vector.
    """
    img = _load_pil_image(image_input)
    if img is None:
        return None

    try:
        img = img.convert("RGB")
        # 1. 8x8 spatial grid color distribution (64 patches * 6 stats = 384 dims)
        img_grid = img.resize((32, 32), Image.Resampling.BILINEAR)
        arr = np.array(img_grid, dtype=np.float32) / 255.0

        feats = []
        # Grid 4x4 blocks
        for r in range(4):
            for c in range(4):
                block = arr[r*8:(r+1)*8, c*8:(c+1)*8]
                mean_rgb = block.mean(axis=(0, 1))
                std_rgb = block.std(axis=(0, 1))
                feats.extend(mean_rgb.tolist())
                feats.extend(std_rgb.tolist())

        # 2. Overall HSV & Luminance distribution (96 dims)
        hsv_img = img.convert("HSV").resize((64, 64))
        hsv_arr = np.array(hsv_img, dtype=np.float32) / 255.0
        h_hist, _ = np.histogram(hsv_arr[:, :, 0], bins=32, range=(0, 1))
        s_hist, _ = np.histogram(hsv_arr[:, :, 1], bins=32, range=(0, 1))
        v_hist, _ = np.histogram(hsv_arr[:, :, 2], bins=32, range=(0, 1))
        feats.extend(h_hist.tolist())
        feats.extend(s_hist.tolist())
        feats.extend(v_hist.tolist())

        # 3. Edge / gradient texture (32 dims)
        gray = img.convert("L").resize((32, 32))
        g_arr = np.array(gray, dtype=np.float32)
        dx = np.abs(np.diff(g_arr, axis=1)).mean(axis=0) # 31 dims
        feats.extend(dx[:32].tolist())

        # Pad or slice to exactly dim
        vec = np.zeros(dim, dtype=np.float32)
        usable = min(len(feats), dim)
        vec[:usable] = feats[:usable]

        norm = np.linalg.norm(vec)
        if norm > 1e-6:
            vec = vec / norm
        return vec.tolist()
    except Exception:
        return None


def get_image_embedding(image_input) -> list:
    """Generates an image embedding vector using Torchvision MobileNet or perceptual feature extractor."""
    init_ml_models()
    img = _load_pil_image(image_input)
    if img is not None and _vision_model is not None and _vision_transform is not None:
        try:
            import torch
            img_rgb = img.convert("RGB")
            tensor = _vision_transform(img_rgb).unsqueeze(0)
            with torch.no_grad():
                emb = _vision_model(tensor).squeeze().numpy()
            norm = np.linalg.norm(emb)
            if norm > 1e-6:
                emb = emb / norm
            return emb.tolist()
        except Exception:
            pass
    return _fallback_image_embedding(image_input)


# --- Cosine Similarity Helper ---
def cosine_similarity(v1: list, v2: list) -> float:
    if not v1 or not v2:
        return 0.0
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a < 1e-6 or norm_b < 1e-6:
        return 0.0
    sim = dot / (norm_a * norm_b)
    return float(max(0.0, min(1.0, sim)))


# --- Levenshtein Distance Helper ---
def levenshtein_ratio(s1: str, s2: str) -> float:
    s1 = s1.lower().strip()
    s2 = s2.lower().strip()
    if s1 == s2:
        return 1.0
    if not s1 or not s2:
        return 0.0

    len1, len2 = len(s1), len(s2)
    dp = [[0] * (len2 + 1) for _ in range(len1 + 1)]

    for i in range(len1 + 1):
        dp[i][0] = i
    for j in range(len2 + 1):
        dp[0][j] = j

    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,      # deletion
                dp[i][j - 1] + 1,      # insertion
                dp[i - 1][j - 1] + cost # substitution
            )

    dist = dp[len1][len2]
    max_len = max(len1, len2)
    return max(0.0, 1.0 - (dist / max_len))


# --- Color Taxonomy & Synonym Matcher ---
COLOR_FAMILIES = {
    "black": ["black", "charcoal", "ebony", "matte black", "dark black", "midnight", "jet black"],
    "white": ["white", "ivory", "cream", "pearl", "off-white", "eggshell"],
    "blue": ["blue", "navy", "cyan", "azure", "cobalt", "midnight blue", "sky blue", "teal", "royal blue"],
    "red": ["red", "crimson", "scarlet", "ruby", "burgundy", "maroon", "cherry"],
    "grey": ["grey", "gray", "silver", "slate", "ash", "graphite", "metallic", "space grey"],
    "green": ["green", "olive", "emerald", "lime", "mint", "forest green", "sage"],
    "yellow": ["yellow", "gold", "amber", "mustard", "lemon"],
    "brown": ["brown", "tan", "chocolate", "caramel", "khaki", "beige", "bronze", "leather"],
    "purple": ["purple", "violet", "lavender", "plum", "magenta", "lilac"],
    "pink": ["pink", "rose", "coral", "blush", "salmon"],
    "orange": ["orange", "peach", "rust", "tangerine"]
}

def compute_color_similarity(c1: str, c2: str) -> float:
    c1 = (c1 or "").lower().strip()
    c2 = (c2 or "").lower().strip()
    if not c1 or not c2:
        return 0.5  # neutral if unstated

    if c1 == c2 or c1 in c2 or c2 in c1:
        return 1.0

    # Family match
    fam1, fam2 = set(), set()
    for fam, syns in COLOR_FAMILIES.items():
        if any(s in c1 for s in syns):
            fam1.add(fam)
        if any(s in c2 for s in syns):
            fam2.add(fam)

    if fam1 and fam2 and (fam1 & fam2):
        return 0.85

    # Levenshtein fallback
    return levenshtein_ratio(c1, c2) * 0.7


# --- Brand Similarity ---
def compute_brand_similarity(b1: str, b2: str, title1: str = "", title2: str = "") -> float:
    b1 = (b1 or "").lower().strip()
    b2 = (b2 or "").lower().strip()

    # If both explicitly provided
    if b1 and b2:
        if b1 == b2:
            return 1.0
        if b1 in b2 or b2 in b1:
            return 0.90
        lev = levenshtein_ratio(b1, b2)
        if lev > 0.8:
            return 0.85
        return lev * 0.5

    # If one omitted brand, check if brand is mentioned in other's title/description
    known_brand = b1 or b2
    if known_brand:
        target_text = f"{title1} {title2}".lower()
        if known_brand in target_text:
            return 0.85
        return 0.5  # neutral

    # Neither specified brand
    return 0.7  # neutral score, does not penalize


# --- Campus Location Proximity ---
CAMPUS_ZONES = [
    "library", "canteen", "cafeteria", "block a", "block b", "block c", "block d",
    "sports complex", "gym", "gymnasium", "hostel", "admin", "auditorium",
    "parking", "laboratory", "lab", "classroom", "student center", "main gate"
]

def compute_location_similarity(loc1: str, loc2: str) -> tuple[float, str]:
    l1 = (loc1 or "").lower().strip()
    l2 = (loc2 or "").lower().strip()

    if l1 == l2:
        return 1.0, f"Identical location reported ('{loc1}')"

    # Identify primary campus zone
    zone1 = next((z for z in CAMPUS_ZONES if z in l1), None)
    zone2 = next((z for z in CAMPUS_ZONES if z in l2), None)

    if zone1 and zone2:
        if zone1 == zone2:
            # Same zone (e.g. both in Library), check floor/room
            floor1 = re.search(r"\b(\d+)(st|nd|rd|th)?\s*(floor|level|fl)\b", l1)
            floor2 = re.search(r"\b(\d+)(st|nd|rd|th)?\s*(floor|level|fl)\b", l2)
            if floor1 and floor2:
                if floor1.group(1) == floor2.group(1):
                    return 0.95, f"Exact same zone and floor ({zone1.title()}, Floor {floor1.group(1)})"
                return 0.80, f"Same building ({zone1.title()}), different floors"
            return 0.88, f"Same campus area ({zone1.title()})"
        else:
            return 0.35, f"Different campus zones ('{zone1.title()}' vs '{zone2.title()}')"

    # Token overlap and Levenshtein fallback
    tokens1 = set(re.findall(r"\w+", l1))
    tokens2 = set(re.findall(r"\w+", l2))
    overlap = len(tokens1 & tokens2) / max(1, len(tokens1 | tokens2))

    lev = levenshtein_ratio(l1, l2)
    score = max(overlap, lev)
    if score > 0.7:
        desc = f"Strong location phrase match ('{loc1}' ~ '{loc2}')"
    elif score > 0.4:
        desc = f"Moderate location overlap ('{loc1}' / '{loc2}')"
    else:
        desc = f"Disparate campus locations ('{loc1}' vs '{loc2}')"

    return float(score), desc


# --- Temporal Proximity (Exponential Decay) ---
def compute_temporal_similarity(date_lost, date_found, tau_days: float = 14.0) -> tuple[float, str]:
    if isinstance(date_lost, str):
        date_lost = datetime.fromisoformat(date_lost.replace("Z", "")).date()
    elif isinstance(date_lost, datetime):
        date_lost = date_lost.date()

    if isinstance(date_found, str):
        date_found = datetime.fromisoformat(date_found.replace("Z", "")).date()
    elif isinstance(date_found, datetime):
        date_found = date_found.date()

    delta_days = (date_found - date_lost).days

    if delta_days == 0:
        return 1.0, "Reported lost and found on the exact same date"

    if delta_days > 0:
        # Normal timeline: item lost first, found delta_days later
        decay = math.exp(-delta_days / tau_days)
        score = max(0.05, min(1.0, decay))
        if delta_days <= 2:
            return score, f"Found {delta_days} day(s) after loss (immediate temporal window)"
        elif delta_days <= 7:
            return score, f"Found within {delta_days} days of loss (high proximity)"
        else:
            return score, f"Found {delta_days} days after loss (gradual time decay)"
    else:
        # Found date before loss date: slight anomaly or reporting date error
        abs_delta = abs(delta_days)
        if abs_delta <= 2:
            decay = 0.75 * math.exp(-abs_delta / 7.0)
            return decay, f"Minor {abs_delta}-day reporting discrepancy (within plausible memory window)"
        else:
            decay = max(0.02, 0.4 * math.exp(-abs_delta / 7.0))
            return decay, f"Found report dated {abs_delta} days before lost report"


# --- Category Gate / Hard Filter ---
CATEGORY_GROUPS = {
    "electronics": ["electronics", "audio", "gadgets", "phones", "laptops", "tablets", "cables", "chargers"],
    "accessories": ["accessories", "clothing", "jewelry", "watches", "glasses", "sunglasses", "hats"],
    "stationery": ["stationery", "books", "notebooks", "pens", "calculators"],
    "personal": ["id cards", "wallets", "bags", "purses", "keys", "cards", "documents", "personal items"],
}

def category_passes_gate(cat1: str, cat2: str, title1: str, title2: str) -> tuple[bool, str]:
    c1 = (cat1 or "").lower().strip()
    c2 = (cat2 or "").lower().strip()

    if c1 == c2:
        return True, f"Identical category: {cat1}"

    # Group compatibility
    grp1 = next((g for g, members in CATEGORY_GROUPS.items() if any(m in c1 for m in members)), None)
    grp2 = next((g for g, members in CATEGORY_GROUPS.items() if any(m in c2 for m in members)), None)

    if grp1 and grp2 and grp1 == grp2:
        return True, f"Compatible category domain ({cat1} & {cat2})"

    # If categorized differently, check title token overlap
    t1_tokens = set(re.findall(r"\w+", title1.lower()))
    t2_tokens = set(re.findall(r"\w+", title2.lower()))
    overlap = len(t1_tokens & t2_tokens)
    if overlap >= 2:
        return True, f"Cross-category exception granted due to strong title overlap ({overlap} common terms)"

    return False, f"Category mismatch ({cat1} vs {cat2})"


# --- Multi-Modal Matching Engine ---
def evaluate_match(lost_item, found_item) -> dict:
    """
    Computes multi-modal similarity score (0 - 100%) and itemized breakdown
    between a LOST item and a FOUND item according to Section 3 specs.
    """
    # 1. Category Gate
    gate_pass, gate_reason = category_passes_gate(
        lost_item.category, found_item.category,
        lost_item.title, found_item.title
    )
    if not gate_pass:
        return {
            "total_score": 0.0,
            "sub_scores": {
                "semantic_desc": 0.0,
                "visual": 0.0,
                "attribute": 0.0,
                "location": 0.0,
                "temporal": 0.0,
                "weights_used": {},
                "gate_passed": False,
                "gate_reason": gate_reason,
                "explanations": [f"Filtered out: {gate_reason}"]
            }
        }

    # 2. Semantic Description Similarity (S_desc)
    # Combine title, description, and keywords
    desc_sim = cosine_similarity(lost_item.text_embedding, found_item.text_embedding)
    # Give slight boost if exact words match in title
    title_overlap = levenshtein_ratio(lost_item.title, found_item.title)
    s_desc = 0.75 * desc_sim + 0.25 * title_overlap
    s_desc = float(max(0.0, min(1.0, s_desc)))

    # 3. Visual Similarity (S_img)
    has_lost_img = bool(lost_item.image_embedding)
    has_found_img = bool(found_item.image_embedding)
    both_have_images = has_lost_img and has_found_img

    if both_have_images:
        s_img = cosine_similarity(lost_item.image_embedding, found_item.image_embedding)
        img_explanation = f"Visual multi-modal match: {round(s_img * 100, 1)}% feature similarity"
    else:
        s_img = 0.0
        if not has_lost_img and not has_found_img:
            img_explanation = "No images uploaded on either report; visual weight dynamically reallocated"
        elif not has_lost_img:
            img_explanation = "Lost report missing image; visual weight dynamically reallocated"
        else:
            img_explanation = "Found report missing image; visual weight dynamically reallocated"

    # 4. Attribute Match (S_attr) = 0.55 * Color + 0.45 * Brand
    s_color = compute_color_similarity(lost_item.color, found_item.color)
    s_brand = compute_brand_similarity(
        lost_item.brand, found_item.brand,
        lost_item.title, found_item.title
    )
    s_attr = 0.55 * s_color + 0.45 * s_brand

    # 5. Location Match (S_loc)
    s_loc, loc_explanation = compute_location_similarity(lost_item.location, found_item.location)

    # 6. Temporal Proximity (S_time)
    s_time, time_explanation = compute_temporal_similarity(
        lost_item.date_lost_or_found,
        found_item.date_lost_or_found
    )

    # 7. Dynamic Weight Distribution
    if both_have_images:
        w_desc = 0.35
        w_img = 0.30
        w_attr = 0.15
        w_loc = 0.10
        w_time = 0.10
    else:
        # Redistribute 0.30 w_img: +0.15 to desc, +0.10 to attr, +0.05 to loc
        w_desc = 0.50
        w_img = 0.00
        w_attr = 0.25
        w_loc = 0.15
        w_time = 0.10

    raw_score = (
        w_desc * s_desc +
        w_img * s_img +
        w_attr * s_attr +
        w_loc * s_loc +
        w_time * s_time
    ) * 100.0

    total_score = round(max(0.0, min(100.0, raw_score)), 1)

    # Detailed Explanations
    color_desc = f"Color similarity: {round(s_color * 100)}% ('{lost_item.color}' vs '{found_item.color}')"
    brand_desc = f"Brand similarity: {round(s_brand * 100)}% ('{lost_item.brand or 'N/A'}' vs '{found_item.brand or 'N/A'}')"
    desc_text = f"Semantic description match: {round(s_desc * 100, 1)}% NLP text overlap"

    explanations = [
        desc_text,
        img_explanation,
        f"{color_desc} | {brand_desc}",
        loc_explanation,
        time_explanation
    ]

    return {
        "total_score": total_score,
        "sub_scores": {
            "semantic_desc": round(s_desc * 100, 1),
            "visual": round(s_img * 100, 1) if both_have_images else None,
            "attribute": round(s_attr * 100, 1),
            "color_score": round(s_color * 100, 1),
            "brand_score": round(s_brand * 100, 1),
            "location": round(s_loc * 100, 1),
            "temporal": round(s_time * 100, 1),
            "weights_used": {
                "w_desc": w_desc,
                "w_img": w_img,
                "w_attr": w_attr,
                "w_loc": w_loc,
                "w_time": w_time
            },
            "gate_passed": True,
            "gate_reason": gate_reason,
            "explanations": explanations
        }
    }


def compute_all_matches_for_item(item, db_session, threshold: float = 50.0):
    """
    Computes and stores/updates all matches between the given item and candidate items of the opposite type.
    If item is LOST, candidate items are open FOUND reports.
    If item is FOUND, candidate items are open LOST reports.
    """
    from backend.models import ItemReport, MatchResult

    target_type = "FOUND" if item.type == "LOST" else "LOST"
    candidates = db_session.query(ItemReport).filter(
        ItemReport.type == target_type,
        ItemReport.status.in_(["OPEN", "CLAIM_PENDING"])
    ).all()

    created_matches = []
    for cand in candidates:
        lost = item if item.type == "LOST" else cand
        found = cand if item.type == "LOST" else item

        eval_result = evaluate_match(lost, found)
        score = eval_result["total_score"]

        # Only retain matches meeting or exceeding threshold
        if score >= threshold:
            # Check if match already exists
            existing = db_session.query(MatchResult).filter(
                MatchResult.lost_item_id == lost.id,
                MatchResult.found_item_id == found.id
            ).first()

            if existing:
                existing.total_score = score
                existing.sub_scores = eval_result["sub_scores"]
                created_matches.append(existing)
            else:
                new_match = MatchResult(
                    lost_item_id=lost.id,
                    found_item_id=found.id,
                    total_score=score,
                    sub_scores=eval_result["sub_scores"],
                    status="SUGGESTED"
                )
                db_session.add(new_match)
                created_matches.append(new_match)

    db_session.commit()
    return created_matches
