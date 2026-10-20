import os
import sys
import json
import joblib
import numpy as np

os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# -------------------------------------------------------------
# 1. Dataset for Department & Category Classification
# -------------------------------------------------------------
DEPARTMENT_DATA = [
    # Academic Affairs - Examination Issues (ACAD)
    ("My semester examination marks are wrong and hall ticket is not issued", "Academic Affairs", "Examination Issues", "ACAD"),
    ("I appeared for the end semester math exam but portal marks me absent", "Academic Affairs", "Examination Issues", "ACAD"),
    ("Revaluation result for discrete mathematics is pending for two months", "Academic Affairs", "Examination Issues", "ACAD"),
    ("Grade card has wrong CGPA calculation and supplementary fee issue", "Academic Affairs", "Examination Issues", "ACAD"),
    ("Hall ticket download gives server error before university exams start tomorrow", "Academic Affairs", "Examination Issues", "ACAD"),
    ("Internal assessment marks were not uploaded by the professor", "Academic Affairs", "Examination Issues", "ACAD"),
    ("Failed status shown on portal despite scoring passing marks in answer sheet", "Academic Affairs", "Examination Issues", "ACAD"),
    ("Backlog exam timetable clashes with regular 6th semester paper", "Academic Affairs", "Examination Issues", "ACAD"),

    # Academic Affairs - Course & Curriculum (ACAD)
    ("Syllabus for data structures has not been completed before mid terms", "Academic Affairs", "Course & Curriculum", "ACAD"),
    ("Elective subject selection was locked without notifying students", "Academic Affairs", "Course & Curriculum", "ACAD"),
    ("Project guide has not been allotted for final year capstone", "Academic Affairs", "Course & Curriculum", "ACAD"),
    ("Lab practical schedule overlaps with morning theory lectures", "Academic Affairs", "Course & Curriculum", "ACAD"),
    ("Assignment deadline is unrealistic given back to back class schedule", "Academic Affairs", "Course & Curriculum", "ACAD"),

    # Academic Affairs - Faculty & Teaching Quality (ACAD)
    ("Professor frequently cancels lectures without prior notice or substitute", "Academic Affairs", "Faculty & Teaching Quality", "ACAD"),
    ("Teaching quality in machine learning course is poor and professor does not clarify doubts", "Academic Affairs", "Faculty & Teaching Quality", "ACAD"),
    ("Faculty shows favoritism and unfair grading in continuous evaluation", "Academic Affairs", "Faculty & Teaching Quality", "ACAD"),

    # Hostel & Accommodation - Room & Facilities (HSTL)
    ("Hostel block C room 204 ceiling fan is broken and sparking", "Hostel & Accommodation", "Room & Facilities", "HSTL"),
    ("No water supply in 3rd floor washrooms of girls hostel since yesterday", "Hostel & Accommodation", "Room & Facilities", "HSTL"),
    ("Hostel room window glass is shattered during storm and rain enters", "Hostel & Accommodation", "Room & Facilities", "HSTL"),
    ("Electricity power outage in boys hostel wing B for past 12 hours", "Hostel & Accommodation", "Room & Facilities", "HSTL"),
    ("Bed mattress provided in room is torn and bedbugs infestation", "Hostel & Accommodation", "Room & Facilities", "HSTL"),
    ("Warden is unresponsive to repeated maintenance requests for broken bathroom door", "Hostel & Accommodation", "Room & Facilities", "HSTL"),

    # Hostel & Accommodation - Mess & Food (HSTL)
    ("Mess dinner was spoiled and insects were found in dal and rice", "Hostel & Accommodation", "Mess & Food", "HSTL"),
    ("Several students got food poisoning and vomiting after eating mess lunch", "Hostel & Accommodation", "Mess & Food", "HSTL"),
    ("Drinking water filter in mess hall is uncleaned and smells foul", "Hostel & Accommodation", "Mess & Food", "HSTL"),
    ("Mess menu is never followed and food is constantly served cold and stale", "Hostel & Accommodation", "Mess & Food", "HSTL"),

    # IT & Technical Support (IT)
    ("Campus WiFi is down in academic block 3 and login credentials fail", "IT & Technical Support", "Network & Connectivity", "IT"),
    ("Student ERP portal times out when trying to register for courses", "IT & Technical Support", "Network & Connectivity", "IT"),
    ("Computer science lab 4 has half the systems not booting or blue screened", "IT & Technical Support", "Network & Connectivity", "IT"),
    ("Forgot student email password and password reset link is never sent", "IT & Technical Support", "Network & Connectivity", "IT"),
    ("Slow internet speed on campus LAN makes research paper access impossible", "IT & Technical Support", "Network & Connectivity", "IT"),

    # Finance & Fees (FIN)
    ("Paid tuition fee online through net banking but payment receipt was not generated", "Finance & Fees", "Fee Payment & Receipts", "FIN"),
    ("Scholarship amount sanctioned by government not credited to student account", "Finance & Fees", "Fee Payment & Receipts", "FIN"),
    ("Excess fine charged for delayed library book return despite system error", "Finance & Fees", "Fee Payment & Receipts", "FIN"),
    ("Refund for hostel caution deposit has been delayed for three months", "Finance & Fees", "Fee Payment & Receipts", "FIN"),
    ("Bank challan rejected at finance desk due to obsolete fee structure", "Finance & Fees", "Fee Payment & Receipts", "FIN"),

    # Library (LIB)
    ("Reference textbooks for artificial intelligence are always out of stock", "Library", "Book & Resource Access", "LIB"),
    ("Digital IEEE Xplore subscription expired and students cannot access papers", "Library", "Book & Resource Access", "LIB"),
    ("Library reading room air conditioning is not functioning during summer", "Library", "Book & Resource Access", "LIB"),
    ("Librarian refused to reissue study book even when no other reserves existed", "Library", "Book & Resource Access", "LIB"),

    # Student Welfare & Counseling (WELF)
    ("Experiencing extreme anxiety and panic attacks regarding academic pressure need counselor", "Student Welfare & Counseling", "Mental Health & Support", "WELF"),
    ("Need urgent confidential mental health consultation with university doctor", "Student Welfare & Counseling", "Mental Health & Support", "WELF"),
    ("Facing continuous harassment and cyber bullying from batchmates in group chat", "Student Welfare & Counseling", "Mental Health & Support", "WELF"),
    ("First aid facility in campus dispensary ran out of basic emergency medicines", "Student Welfare & Counseling", "Mental Health & Support", "WELF"),

    # Sports & Extracurricular (SPRT)
    ("Basketball court floodlights are damaged preventing evening practice", "Sports & Extracurricular", "Facilities & Equipment", "SPRT"),
    ("Gymnasium equipment like treadmills and dumbbells are rusted and unsafe", "Sports & Extracurricular", "Facilities & Equipment", "SPRT"),
    ("Sports kit budget for inter-college football tournament was cancelled abruptly", "Sports & Extracurricular", "Facilities & Equipment", "SPRT"),

    # Transportation (TRNS)
    ("College bus route number 14 is consistently late by 45 minutes every morning", "Transportation", "Bus Service", "TRNS"),
    ("Bus driver was driving recklessly and over speeding on the highway", "Transportation", "Bus Service", "TRNS"),
    ("Renewed bus pass is showing expired on the student QR scanner", "Transportation", "Bus Service", "TRNS"),

    # Canteen & Food Services (CANT)
    ("Main campus cafeteria charging prices higher than printed MRP", "Canteen & Food Services", "Food Quality & Hygiene", "CANT"),
    ("Stale sandwiches and unhygienic food preparation observed at campus food court", "Canteen & Food Services", "Food Quality & Hygiene", "CANT"),

    # Placement & Career Services (PLCMNT)
    ("Not allowed to attend campus interview drive due to false eligibility record", "Placement & Career Services", "Placement Process", "PLCMNT"),
    ("Company offer letter withheld by placement office without explanation", "Placement & Career Services", "Placement Process", "PLCMNT"),
    ("Internship attendance was not verified causing company stipend forfeiture", "Placement & Career Services", "Placement Process", "PLCMNT"),

    # Ragging & Discipline (DISC)
    ("Senior students are forcing first years to do physical tasks and abusive hazing in hostel", "Ragging & Discipline", "Anti-Ragging", "DISC"),
    ("Received violent threats and physical assault warnings from senior students", "Ragging & Discipline", "Anti-Ragging", "DISC"),
    ("Hostel ragging incident occurring right now in room 312 seniors bullying juniors", "Ragging & Discipline", "Anti-Ragging", "DISC")
]

# -------------------------------------------------------------
# 2. Dataset for Severity and Urgency Detection
# (Distinct from sentiment: labeled by genuine urgency & time consequence)
# -------------------------------------------------------------
URGENCY_DATA = [
    # CRITICAL: Immediate danger, anti-ragging, medical, exam starting immediately, fee portal deadline today
    ("Hostel ragging incident seniors physically threatening juniors right now in block B", "CRITICAL"),
    ("Severe food poisoning in hostel mess ten students vomiting blood and passing out", "CRITICAL"),
    ("University exam starts in 2 hours and hall ticket is blocked on portal", "CRITICAL"),
    ("Fee portal closes tonight at midnight payment failed and money debited from account", "CRITICAL"),
    ("Student experiencing severe suicidal ideation and mental breakdown needs immediate intervention", "CRITICAL"),
    ("Fire sparking from electrical fuse box in hostel corridor smoke filling rooms", "CRITICAL"),
    ("Physical assault and violent attack occurred near the campus back gate", "CRITICAL"),
    ("Medical emergency at sports ground student collapsed with head injury during football match", "CRITICAL"),

    # HIGH: Significant academic impact, multi-student utility failure, upcoming deadlines within 48h
    ("Semester exam results declare me absent for a subject I attended revaluation ends in two days", "HIGH"),
    ("No water supply in entire girls hostel block for over 24 hours sanitation critical", "HIGH"),
    ("Power outage in engineering computer lab right before final project presentation tomorrow", "HIGH"),
    ("Scholarship verification deadline is tomorrow and dean office signature is pending", "HIGH"),
    ("Campus bus driver reckless driving almost caused an accident with truck this morning", "HIGH"),
    ("Continuous sexual harassment and stalking by a classmate on campus grounds", "HIGH"),
    ("Placement drive registration closes today but student profile is locked as disqualified by error", "HIGH"),
    ("Hostel room ceiling plaster fell down on study table during rain", "HIGH"),

    # MEDIUM: Routine operational concerns, non-emergency maintenance, standard academic requests
    ("Campus WiFi connection drops intermittently in classroom 302 during afternoon lectures", "MEDIUM"),
    ("Elective course assignment submission date overlaps with another core subject deadline", "MEDIUM"),
    ("Hostel room door latch is loose and needs carpenter repair", "MEDIUM"),
    ("Mess dinner was cold yesterday and rotis were hard", "MEDIUM"),
    ("Library digital catalog system search is sluggish and slow to respond", "MEDIUM"),
    ("College bus timing from south station arrived 15 minutes late twice this week", "MEDIUM"),
    ("Water cooler in second floor corridor is dispensing warm water instead of cold", "MEDIUM"),
    ("Professor spoke too quickly during modern physics lecture and did not share class slides", "MEDIUM"),
    ("Cafeteria vendor charged 5 rupees extra on cold drink bottle", "MEDIUM"),
    ("Gym treadmill speed button is stuck on setting 4", "MEDIUM"),

    # LOW: Minor suggestions, aesthetic preferences, feature requests, polite inquiries
    ("I would like to suggest adding more comfortable bean bags to the library quiet corner", "LOW"),
    ("Can the college canteen introduce more fruit juices or green tea on the menu", "LOW"),
    ("Requesting to add a new cricket ball set to the sports department inventory for next semester", "LOW"),
    ("The university newsletter font looks a bit outdated could we redesign the cover template", "LOW"),
    ("Suggestion to plant more shady trees along the pathway between block A and block B", "LOW"),
    ("Could the campus radio play instrumental music during the afternoon lunch break", "LOW"),
    ("Inquiry about whether cultural fest participation certificates will be given in print or PDF", "LOW"),
    ("Suggestion to place an extra dustbin near the east parking lot", "LOW")
]

def train_and_save():
    print("[AI Train] Training Department & Category Classifier (TF-IDF + Logistic Regression)...")
    texts = [item[0] for item in DEPARTMENT_DATA]
    # We can encode compound labels: "department|||category|||subcategory|||code"
    labels = [f"{item[1]}|||{item[2]}|||{item[3]}" for item in DEPARTMENT_DATA]

    dept_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
        ('clf', LogisticRegression(C=2.0, max_iter=1000, multi_class='multinomial', random_state=42))
    ])

    dept_pipeline.fit(texts, labels)
    dept_model_path = os.path.join(CURRENT_DIR, 'department_model.joblib')
    joblib.dump(dept_pipeline, dept_model_path)
    print(f"[AI Train] Saved Department Model to {dept_model_path}")

    print("[AI Train] Training Severity & Urgency Classifier (TF-IDF + Logistic Regression)...")
    u_texts = [item[0] for item in URGENCY_DATA]
    u_labels = [item[1] for item in URGENCY_DATA]

    urgency_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
        ('clf', LogisticRegression(C=1.5, max_iter=1000, class_weight='balanced', random_state=42))
    ])

    urgency_pipeline.fit(u_texts, u_labels)
    urgency_model_path = os.path.join(CURRENT_DIR, 'urgency_model.joblib')
    joblib.dump(urgency_pipeline, urgency_model_path)
    print(f"[AI Train] Saved Urgency Model to {urgency_model_path}")

    # Evaluate on a few test cases
    test_samples = [
        "My mathematics exam paper results are missing on student portal and hall ticket is blocked",
        "Hostel boys are ragging and beating a 1st year student in room 105 right now",
        "It would be nice to have more magazines in the library reading lounge",
        "Hostel block A has no water supply and electricity since morning"
    ]

    print("\n--- Model Verification ---")
    for s in test_samples:
        dept_pred = dept_pipeline.predict([s])[0]
        dept_probs = dept_pipeline.predict_proba([s])[0]
        dept_conf = float(np.max(dept_probs))
        dept, subcat, code = dept_pred.split("|||")

        urg_pred = urgency_pipeline.predict([s])[0]
        urg_probs = urgency_pipeline.predict_proba([s])[0]
        urg_conf = float(np.max(urg_probs))

        print(f"Text: '{s}'")
        print(f"  -> Dept: {dept} ({code}) | Sub: {subcat} | Conf: {dept_conf:.2f}")
        print(f"  -> Urgency: {urg_pred} | Conf: {urg_conf:.2f}")

    print("\n[AI Train] Training and validation successfully completed.")

if __name__ == "__main__":
    train_and_save()
