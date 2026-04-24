import os
import django
import sys
import random
import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sms.models import Student, SubjectMark, Course

BRANCHES = {
    'Civil Engineering': 'CV',
    'Mechanical Engineering': 'ME',
    'Information Technology': 'IT',
    'Computer Science Engineering': 'CS',
    'Electronics & Comm.': 'EC'
}

FIRST_NAMES = ["Amit", "Sneha", "Rahul", "Priya", "Vikram", "Anjali", "Rohan", "Neha", "Aditya", "Pooja", "Kartik", "Kirti", "Arjun", "Simran", "Deepak", "Aishwarya", "Vivek", "Riya", "Karan", "Kavya", "Manish", "Nisha", "Sanjay", "Swati", "Tarun", "Divya"]
LAST_NAMES = ["Sharma", "Verma", "Gupta", "Patil", "Deshmukh", "Singh", "Kumar", "Iyer", "Nair", "Reddy", "Menon", "Joshi", "Chopra", "Kaur", "Das", "Bose", "Mehta", "Chauhan", "Yadav", "Bhat"]

COMMON_SUBJECT_NAMES = [
    "Engineering Mathematics", "Engineering Physics", "Engineering Chemistry", 
    "Basic Electronics", "Computer Programming", "English Communication",
    "Data Structures", "Algorithms", "Operating Systems", "Discrete Mathematics",
    "Database Systems", "Software Engineering", "Computer Networks", "Cyber Security",
    "Thermodynamics", "Fluid Mechanics", "Solid Mechanics", "Material Science",
    "Structural Analysis", "Surveying", "Geotechnical Engineering", "Transportation Engg",
    "Analog Circuits", "Digital Logic", "Signals & Systems", "Microprocessors",
    "Artificial Intelligence", "Machine Learning", "Cloud Computing", "Data Science",
    "Control Systems", "Power Systems", "Electrical Machines", "Power Electronics"
]

def generate_curriculum():
    curriculum = {}
    for branch, code in BRANCHES.items():
        curriculum[branch] = {}
        for sem in range(1, 9):
            curriculum[branch][sem] = []
            for i in range(1, 6): # 5 courses per sem per branch
                c_code = f"{code}{sem}0{i}" 
                c_name = random.choice(COMMON_SUBJECT_NAMES)
                
                if sem > 2:
                    c_name = f"{branch.split(' ')[0]} {c_name} {sem}.{i}"
                else:
                    c_name = f"Basic {c_name} (Sem {sem})"
                
                curriculum[branch][sem].append({
                    'code': c_code,
                    'name': c_name,
                    'credits': random.choice([3, 4])
                })
    return curriculum

def add_students_and_marks(num_students=150):
    print(f"Generating {num_students} new students to guarantee massive variation...")
    curriculum = generate_curriculum()
    
    current_year = datetime.datetime.now().year
    
    students_created = 0
    marks_created = 0
    
    for i in range(num_students):
        fname = random.choice(FIRST_NAMES)
        lname = random.choice(LAST_NAMES)
        branch_name = random.choice(list(BRANCHES.keys()))
        s_id = f"1NT{random.randint(18, 25)}{BRANCHES[branch_name]}{random.randint(100, 999)}"
        email = f"{fname.lower()}.{lname.lower()}{random.randint(1,999)}@example.com"
        
        # Calculate enrollment date based on logical sem
        current_sem = random.choice([1, 2, 3, 4, 5, 6, 7, 8])
        years_ago = current_sem // 2
        enroll_date = datetime.date(current_year - years_ago, 8, 1)

        student, created = Student.objects.get_or_create(
            student_id=s_id,
            defaults={
                'first_name': fname,
                'last_name': lname,
                'email': email,
                'phone': f"+91{random.randint(7000000000, 9999999999)}",
                'course': branch_name,
                'enrollment_date': enroll_date
            }
        )
        if not created:
            continue
            
        students_created += 1
        
        for sem in range(1, current_sem + 1):
            courses_for_sem = curriculum[branch_name][sem]
            for c in courses_for_sem:
                 luck = random.uniform(0, 1)
                 if luck < 0.1: # Fail / poor
                     cie = random.uniform(10, 22)
                     see = random.uniform(12, 25)
                 elif luck > 0.8: # Distinction
                     cie = random.uniform(40, 50)
                     see = random.uniform(40, 50)
                 else: # Average
                     cie = random.uniform(25, 45)
                     see = random.uniform(25, 45)
                     
                 SubjectMark.objects.create(
                     student=student,
                     semester=sem,
                     course_code=c['code'],
                     subject_name=c['name'],
                     cie_marks=round(cie, 2),
                     see_marks=round(see, 2),
                     credits_registered=c['credits']
                 )
                 marks_created += 1

        if students_created % 20 == 0:
            print(f"Created {students_created} students with marks so far...")

    print(f"DONE! Created {students_created} NEW students with {marks_created} new individualized historic mark records up to highly varied semesters!")

if __name__ == '__main__':
    add_students_and_marks(200)
