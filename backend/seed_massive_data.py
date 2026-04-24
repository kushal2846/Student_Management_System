import os
import django
import sys
import random

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
                # Pick a random realistic subject name, optionally append branch to make it unique or just generic
                c_name = random.choice(COMMON_SUBJECT_NAMES)
                
                # Make course generic if sem 1 or 2, else specialised
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

def execute_seeding():
    print("WARNING: Deleting all existing SubjectMark data...")
    SubjectMark.objects.all().delete()
    print("Existing marks deleted successfully.")

    curriculum = generate_curriculum()
    students = Student.objects.all()
    count = 0
    marks_created = 0

    print(f"Beginning massive seeding for {students.count()} students across 8 semesters...")
    
    for student in students:
        branch = student.course
        # Default fallback if student branch is weird
        if branch not in BRANCHES:
            # Randomly assign one for data integrity
            branch = random.choice(list(BRANCHES.keys()))
            student.course = branch
            student.save()
            
        # Determine randomized current semester for this student (between Sem 1 and Sem 8)
        # So it looks realistic (some are freshmen, some are seniors)
        current_sem = random.randint(1, 8)
        
        for sem in range(1, current_sem + 1):
            courses_for_sem = curriculum[branch][sem]
            for c in courses_for_sem:
                 # Generate realistic marks. Lower semesters might be slightly harder or easier.
                 # Let's add some randomness so sometimes they fail or excel
                 luck = random.uniform(0, 1)
                 if luck < 0.05:
                     cie = random.uniform(10, 25) # Poor performance
                     see = random.uniform(15, 30)
                 elif luck > 0.9:
                     cie = random.uniform(45, 50) # Excellent
                     see = random.uniform(45, 50)
                 else:
                     cie = random.uniform(25, 48) # Average
                     see = random.uniform(25, 48)
                     
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
        count += 1
        if count % 10 == 0:
            print(f"Processed {count} students...")

    print(f"DONE! Generated {marks_created} total mark records for {count} students.")

if __name__ == '__main__':
    execute_seeding()
