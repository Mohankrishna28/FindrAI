import os
import datetime
from PIL import Image, ImageDraw, ImageFont
from backend.database import SessionLocal, Base, engine
from backend.models import ItemReport, MatchResult, ClaimRequest
from backend.matcher import get_text_embedding, get_image_embedding, compute_all_matches_for_item

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def create_sample_item_image(filename: str, bg_color: tuple, text: str, category_icon: str = "📦") -> str:
    """Generates a clean visual preview image for seed items."""
    img_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(img_path):
        width, height = 400, 300
        image = Image.new("RGB", (width, height), color=bg_color)
        draw = ImageDraw.Draw(image)

        # Draw subtle gradient/border
        draw.rectangle([10, 10, width - 10, height - 10], outline=(255, 255, 255, 80), width=3)
        # Inner accent card
        draw.rounded_rectangle([30, 30, width - 30, height - 30], radius=16, fill=(0, 0, 0, 60))

        # Title text
        draw.text((width // 2, height // 2 - 20), text, fill=(255, 255, 255), anchor="mm")
        draw.text((width // 2, height // 2 + 30), f"Item Visual Proof", fill=(220, 220, 220), anchor="mm")

        image.save(img_path, format="JPEG", quality=90)
    return f"/uploads/{filename}"


def seed_database():
    """Initializes tables and seeds 5 realistic LOST items and 5 matching FOUND items."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data for clean seed
    db.query(ClaimRequest).delete()
    db.query(MatchResult).delete()
    db.query(ItemReport).delete()
    db.commit()

    today = datetime.date.today()

    # Define 5 Pairs with realistic scenarios, colors, locations, and dates
    pairs = [
        # Pair 1: Dell XPS Laptop in Library
        {
            "lost": {
                "type": "LOST",
                "title": "Dell XPS 13 Laptop (Midnight Blue) with ACM Sticker",
                "category": "Electronics",
                "brand": "Dell",
                "color": "Midnight Blue",
                "location": "Library 2nd Floor Silent Study Area",
                "date": today - datetime.timedelta(days=3),
                "description": "Left my 13-inch Dell XPS laptop in a midnight blue leather sleeve near cubicle 14 in Library 2nd floor. Has an ACM chapter sticker on the corner.",
                "reporter_name": "Rohan Sharma",
                "reporter_contact": "rohan.s@campus.edu",
                "img_file": "seed_dell_xps_lost.jpg",
                "img_color": (20, 35, 75),
                "img_label": "Dell XPS 13 (Blue)"
            },
            "found": {
                "type": "FOUND",
                "title": "Dell XPS 13 Ultrabook in Dark Blue Protective Sleeve",
                "category": "Electronics",
                "brand": "Dell",
                "color": "Navy Blue",
                "location": "Library 2nd Floor Reading Desks",
                "date": today - datetime.timedelta(days=2),
                "description": "Found a compact Dell XPS 13 laptop in a dark navy blue protective sleeve on a study desk on the second floor of the main library.",
                "reporter_name": "Library Security Desk",
                "reporter_contact": "library-lostfound@campus.edu",
                "img_file": "seed_dell_xps_found.jpg",
                "img_color": (25, 40, 85),
                "img_label": "Found: Dell Laptop"
            }
        },
        # Pair 2: Sony Headphones in Block B Lab
        {
            "lost": {
                "type": "LOST",
                "title": "Sony WH-1000XM4 Noise Canceling Headphones",
                "category": "Electronics",
                "brand": "Sony",
                "color": "Matte Black",
                "location": "Block B Computer Lab 3",
                "date": today - datetime.timedelta(days=4),
                "description": "Black over-ear Sony WH-1000XM4 wireless headphones in hard zipper travel case. Left on desk next to terminal 24 during afternoon lab session.",
                "reporter_name": "Aanya Patel",
                "reporter_contact": "aanya.p@campus.edu",
                "img_file": "seed_sony_headphones_lost.jpg",
                "img_color": (28, 28, 30),
                "img_label": "Sony WH-1000XM4"
            },
            "found": {
                "type": "FOUND",
                "title": "Black Sony Over-Ear Wireless Headphones in Hard Case",
                "category": "Electronics",
                "brand": "Sony",
                "color": "Black",
                "location": "Block B 1st Floor Lab",
                "date": today - datetime.timedelta(days=3),
                "description": "Found black Sony headphones in a black zip pouch on a desk in the computer laboratory in Block B during evening room check.",
                "reporter_name": "Lab Assistant Vikram",
                "reporter_contact": "vikram.lab@campus.edu",
                "img_file": "seed_sony_headphones_found.jpg",
                "img_color": (32, 32, 35),
                "img_label": "Found: Sony Headphones"
            }
        },
        # Pair 3: Brown Leather Fossil Wallet in Canteen
        {
            "lost": {
                "type": "LOST",
                "title": "Fossil Brown Leather Bi-fold Wallet with Student ID",
                "category": "ID Cards & Wallets",
                "brand": "Fossil",
                "color": "Brown",
                "location": "Campus Canteen Food Court",
                "date": today - datetime.timedelta(days=2),
                "description": "Distressed brown leather Fossil bi-fold wallet containing student ID card (ID: 2024-CS-089) and metro transit pass. Lost near the juice counter.",
                "reporter_name": "Kabir Mehta",
                "reporter_contact": "kabir.m@campus.edu",
                "img_file": "seed_wallet_lost.jpg",
                "img_color": (115, 65, 35),
                "img_label": "Fossil Leather Wallet"
            },
            "found": {
                "type": "FOUND",
                "title": "Brown Genuine Leather Men's Wallet (Fossil)",
                "category": "ID Cards & Wallets",
                "brand": "Fossil",
                "color": "Dark Brown",
                "location": "Canteen Juice Counter Table",
                "date": today - datetime.timedelta(days=2),
                "description": "Turned in to counter staff: brown leather wallet by Fossil found on a table near the juice stall in the cafeteria. Has campus cards inside.",
                "reporter_name": "Canteen Staff Manager",
                "reporter_contact": "canteen-ops@campus.edu",
                "img_file": "seed_wallet_found.jpg",
                "img_color": (110, 60, 30),
                "img_label": "Found: Brown Wallet"
            }
        },
        # Pair 4: Hydro Flask in Gym
        {
            "lost": {
                "type": "LOST",
                "title": "Hydro Flask 32oz Insulated Water Bottle (Olive Green)",
                "category": "Personal Items",
                "brand": "Hydro Flask",
                "color": "Olive Green",
                "location": "Gymnasium Weight Room",
                "date": today - datetime.timedelta(days=5),
                "description": "Olive green Hydro Flask wide mouth 32oz metal flask with black flex cap. Has minor dent near the bottom rim.",
                "reporter_name": "Tara Sen",
                "reporter_contact": "tara.sen@campus.edu",
                "img_file": "seed_flask_lost.jpg",
                "img_color": (65, 80, 50),
                "img_label": "Hydro Flask 32oz"
            },
            "found": {
                "type": "FOUND",
                "title": "Olive Green Metal Thermal Water Bottle",
                "category": "Personal Items",
                "brand": "Hydro Flask",
                "color": "Green",
                "location": "Sports Complex / Gym Locker Area",
                "date": today - datetime.timedelta(days=4),
                "description": "Recovered from the sports complex gym bench: olive green Hydro Flask vacuum insulated bottle with black lid.",
                "reporter_name": "Gym Attendant Raj",
                "reporter_contact": "sports-help@campus.edu",
                "img_file": "seed_flask_found.jpg",
                "img_color": (70, 85, 55),
                "img_label": "Found: Green Water Bottle"
            }
        },
        # Pair 5: TI-84 Plus Graphing Calculator in Block A
        {
            "lost": {
                "type": "LOST",
                "title": "Texas Instruments TI-84 Plus CE Graphing Calculator",
                "category": "Books & Stationery",
                "brand": "Texas Instruments",
                "color": "Yellow",
                "location": "Block A Room 204 Lecture Hall",
                "date": today - datetime.timedelta(days=6),
                "description": "Texas Instruments TI-84 Plus CE color graphing calculator with a bright yellow slide cover and engraved initials 'A.K.'.",
                "reporter_name": "Arjun Kapoor",
                "reporter_contact": "arjun.k@campus.edu",
                "img_file": "seed_ti84_lost.jpg",
                "img_color": (210, 175, 40),
                "img_label": "TI-84 Plus CE"
            },
            "found": {
                "type": "FOUND",
                "title": "Texas Instruments Scientific Graphing Calculator",
                "category": "Books & Stationery",
                "brand": "Texas Instruments",
                "color": "Yellow",
                "location": "Block A 2nd Floor Hallway",
                "date": today - datetime.timedelta(days=5),
                "description": "Found a yellow-cased Texas Instruments graphing calculator on the hallway bench outside lecture rooms on Block A level 2.",
                "reporter_name": "Prof. H. Rao",
                "reporter_contact": "h.rao@campus.edu",
                "img_file": "seed_ti84_found.jpg",
                "img_color": (215, 180, 45),
                "img_label": "Found: TI Calculator"
            }
        }
    ]

    saved_items = []

    for pair in pairs:
        # Create Lost item
        lost_data = pair["lost"]
        lost_img_path = create_sample_item_image(
            lost_data["img_file"],
            lost_data["img_color"],
            lost_data["img_label"]
        )
        lost_abs_path = os.path.join(BASE_DIR, lost_img_path.lstrip("/"))
        lost_text = f"{lost_data['title']}. Category: {lost_data['category']}. Brand: {lost_data['brand']}. Color: {lost_data['color']}. Location: {lost_data['location']}. Details: {lost_data['description']}"

        lost_item = ItemReport(
            type="LOST",
            title=lost_data["title"],
            category=lost_data["category"],
            brand=lost_data["brand"],
            color=lost_data["color"],
            location=lost_data["location"],
            date_lost_or_found=lost_data["date"],
            description=lost_data["description"],
            image_url=lost_img_path,
            text_embedding=get_text_embedding(lost_text),
            image_embedding=get_image_embedding(lost_abs_path),
            status="OPEN",
            reporter_name=lost_data["reporter_name"],
            reporter_contact=lost_data["reporter_contact"]
        )
        db.add(lost_item)
        db.commit()
        db.refresh(lost_item)
        saved_items.append(lost_item)

        # Create Found item
        found_data = pair["found"]
        found_img_path = create_sample_item_image(
            found_data["img_file"],
            found_data["img_color"],
            found_data["img_label"]
        )
        found_abs_path = os.path.join(BASE_DIR, found_img_path.lstrip("/"))
        found_text = f"{found_data['title']}. Category: {found_data['category']}. Brand: {found_data['brand']}. Color: {found_data['color']}. Location: {found_data['location']}. Details: {found_data['description']}"

        found_item = ItemReport(
            type="FOUND",
            title=found_data["title"],
            category=found_data["category"],
            brand=found_data["brand"],
            color=found_data["color"],
            location=found_data["location"],
            date_lost_or_found=found_data["date"],
            description=found_data["description"],
            image_url=found_img_path,
            text_embedding=get_text_embedding(found_text),
            image_embedding=get_image_embedding(found_abs_path),
            status="OPEN",
            reporter_name=found_data["reporter_name"],
            reporter_contact=found_data["reporter_contact"]
        )
        db.add(found_item)
        db.commit()
        db.refresh(found_item)
        saved_items.append(found_item)

        # Run matcher for the pair
        compute_all_matches_for_item(lost_item, db, threshold=40.0)

    # Let's add 1 mock claim for testing the Admin verification workflow
    first_match = db.query(MatchResult).first()
    if first_match:
        test_claim = ClaimRequest(
            item_id=first_match.lost_item_id,
            match_id=first_match.id,
            claimant_name="Rohan Sharma",
            claimant_contact="rohan.s@campus.edu",
            proof_description="Laptop has serial number #DXP-2024-8839 and desktop wallpaper is a photo of Golden Gate Bridge with sticker on top left.",
            status="PENDING"
        )
        first_match.lost_item.status = "CLAIM_PENDING"
        db.add(test_claim)
        db.commit()

    db.close()
    print(f"Successfully seeded database with {len(saved_items)} items (5 Lost, 5 Found) and computed matching matrix!")

if __name__ == "__main__":
    seed_database()
