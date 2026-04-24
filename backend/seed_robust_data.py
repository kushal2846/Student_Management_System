import os
import django
import sys
import random
from datetime import date, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sms.models import Student, Attendance, SubjectMark, Course, Library, FinanceRecord, Announcement, Schedule, Exam, Homework
from django.utils import timezone

FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Riya', 'Diya', 'Kavya', 'Sanya', 'Ishaan', 'Shaurya', 'Ananya', 'Aadhya', 'Krish', 'Pranav', 'Rudra', 'Aryan', 'Kiran', 'Nisha', 'Meera', 'Tarun', 'Vikram', 'Pooja', 'Sneha', 'Rishabh', 'Ayesha', 'Rohit', 'Siddharth', 'Neelam', 'Yash', 'Kriti']
LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Joshi', 'Reddy', 'Rao', 'Iyer', 'Deshmukh', 'Chopra', 'Nair', 'Bhat', 'Das', 'Sen', 'Gowda', 'Mishra', 'Pandey', 'Saxena']

COURSE_TEMPLATES = [
    {'code': 'CS101', 'name': 'Data Structures & Algorithms', 'credits': 4, 'prof': 'Dr. Alan Turing', 'color': 'emerald'},
    {'code': 'CS201', 'name': 'Operating Systems', 'credits': 4, 'prof': 'Linus Torvalds', 'color': 'blue'},
    {'code': 'ME101', 'name': 'Engineering Mechanics', 'credits': 4, 'prof': 'Dr. Newton', 'color': 'orange'},
    {'code': 'CE101', 'name': 'Fluid Dynamics', 'credits': 3, 'prof': 'Dr. Bernoulli', 'color': 'cyan'},
    {'code': 'EC101', 'name': 'Digital Electronics', 'credits': 4, 'prof': 'Dr. Shannon', 'color': 'pink'},
    {'code': 'MA101', 'name': 'Calculus & Linear Algebra', 'credits': 3, 'prof': 'Dr. Euler', 'color': 'emerald'},
    {'code': 'PH101', 'name': 'Quantum Physics', 'credits': 3, 'prof': 'Dr. Bohr', 'color': 'blue'},
    {'code': 'IT101', 'name': 'Cloud Computing', 'credits': 3, 'prof': 'Dr. Lovelace', 'color': 'pink'},
]

def seed_data():
    print("Clearing completely ALL old data (Students, Courses, Exams, Homeworks, etc.)...")
    Student.objects.all().delete()
    Attendance.objects.all().delete()
    SubjectMark.objects.all().delete()
    Course.objects.all().delete()
    Schedule.objects.all().delete()
    Exam.objects.all().delete()
    Homework.objects.all().delete()
    Announcement.objects.all().delete()
    Library.objects.all().delete()
    FinanceRecord.objects.all().delete()

    print("Generating Native Engineering Courses...")
    db_courses = []
    for ct in COURSE_TEMPLATES:
        c = Course.objects.create(
            code=ct['code'],
            name=ct['name'],
            professor=ct['prof'],
            days=random.choice(['Monday & Wednesday', 'Tuesday & Thursday', 'Mon, Wed, Fri']),
            start_time=f"{random.randint(8, 14):02d}:00:00",
            end_time=f"{random.randint(15, 17):02d}:00:00",
            room=f"Block {random.choice(['A','B','C'])} - {random.randint(101, 404)}",
            color=ct['color']
        )
        db_courses.append((c, ct['credits']))

    print("Generating 35 fully robust Engineering students...")
    students = []
    for i in range(1, 36):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        student = Student.objects.create(
            student_id=f"1NT{20+random.randint(1, 3)}CS{str(i).zfill(3)}",
            first_name=fn,
            last_name=ln,
            email=f"{fn.lower()}.{ln.lower()}{random.randint(1,99)}@university.edu",
            phone=f"9{random.randint(100000000, 999999999)}",
            course=random.choice(['Computer Science Engineering', 'Information Technology', 'Mechanical Engineering', 'Civil Engineering', 'Electronics & Comm.']),
            enrollment_date=date(2023, random.randint(7, 9), random.randint(1, 28))
        )
        students.append(student)

    print("Generating Attendances from Jan 1st to Current Month...")
    today = date.today()
    start_date = date(today.year, 1, 1)
    working_days = []
    curr = start_date
    while curr <= today:
        if curr.weekday() < 5:  # Mon-Fri
            working_days.append(curr)
        curr += timedelta(days=1)
    
    att_records = []
    for s in students:
        att_prob = random.uniform(0.6, 0.98) 
        for d in working_days:
            is_p = random.random() < att_prob
            att_records.append(Attendance(student=s, date=d, is_present=is_p))
    Attendance.objects.bulk_create(att_records)

    print("Generating Subject Marks Linked to Core Courses...")
    marks_records = []
    for s in students:
        k = random.randint(4, 6)
        selected_courses = random.sample(db_courses, k=k)
        potential_cie = random.uniform(25, 48)
        potential_see = random.uniform(25, 50)
        for c, creds in selected_courses:
            cie = min(50, max(0, potential_cie + random.uniform(-10, 5)))
            see = min(50, max(0, potential_see + random.uniform(-15, 5)))
            marks_records.append(SubjectMark(
                student=s, course_code=c.code, subject_name=c.name,
                cie_marks=round(cie, 2), see_marks=round(see, 2), credits_registered=creds
            ))
    SubjectMark.objects.bulk_create(marks_records)

    print("Generating Exams, Homeworks, and Schedules using Core Courses...")
    for c, _ in db_courses:
        # 1 Exam per course
        exam_date = today + timedelta(days=random.randint(5, 45))
        Exam.objects.create(
            course=c,
            name=f"{c.name} Mid-Term",
            date=exam_date,
            time=c.start_time,
            location=c.room,
            status='Upcoming'
        )
        # 2 Homeworks per course
        Homework.objects.create(
            course=c,
            title=f"Lab Assignment 1",
            description=f"Complete the practical lab constraints for {c.name}.",
            due_date=today + timedelta(days=random.randint(1, 10)),
            status=random.choice(['Pending', 'Submitted'])
        )
        Homework.objects.create(
            course=c,
            title=f"Theory Essay 1",
            description=f"Theoretical report on {c.name} modules.",
            due_date=today + timedelta(days=random.randint(11, 25)),
            status='Pending'
        )
        # Schedule
        Schedule.objects.create(
            course=c,
            weekday=random.choice(['Mon','Tue','Wed','Thu','Fri']),
            start_time=c.start_time,
            end_time=c.end_time,
            room=c.room
        )

    print("Generating Engineering Announcements...")
    Announcement.objects.create(title="Hackathon 2026 Registration Open!", body="All Computer Science and IT students are heavily encouraged to register for the upcoming Hackathon.", author="CS Dept", is_pinned=True)
    Announcement.objects.create(title="Lab Safety Protocols Updated", body="Mechanical and Civil engineering labs have new strict safety protocols. Please read the manual.", author="Engineering Board", is_pinned=True)
    Announcement.objects.create(title="Campus Wi-Fi Maintenance", body="Wi-fi in block A will be down for 2 hours during maintenance.", author="IT Services", is_pinned=False)

    print("Generating Libraries & Financials...")
    for s in students:
        if random.random() > 0.6:
            Library.objects.create(
                title=f"Engineering {random.choice(['Mathematics', 'Physics', 'Mechanics', 'Programming'])}",
                author=random.choice(['R.K. Rajput', 'B.S. Grewal', 'E. Balagurusamy', 'H.C. Verma']),
                borrowed_by=s,
                borrow_date=today - timedelta(days=random.randint(2, 30)),
                status='Borrowed'
            )
        if random.random() > 0.4:
            FinanceRecord.objects.create(
                student=s,
                description=random.choice(['Tuition Fee Semester 8', 'Lab Equipment Fine', 'Hostel Fee', 'Tech Symposium Reg', 'Workshop Fee']),
                record_type=random.choice(['Fee', 'Fine']),
                amount=round(random.uniform(500, 50000), 2),
                paid=random.choice([True, False]),
                due_date=today + timedelta(days=random.randint(-15, 45))
            )

    print("Done! Completely synchronized the database natively to Engineering protocols.")

if __name__ == "__main__":
    seed_data()
