import os
import django
import sys
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sms.models import Student, SubjectMark
from django.db.models import Max

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
            for i in range(1, 6):
                c_code = f"{code}{sem}0{i}" 
                c_name = random.choice(COMMON_SUBJECT_NAMES)
                if sem > 2:
                    c_name = f"{branch.split(' ')[0]} {c_name} {sem}.{i}"
                else:
                    c_name = f"Basic {c_name} (Sem {sem})"
                curriculum[branch][sem].append({'code': c_code, 'name': c_name, 'credits': random.choice([3, 4])})
    return curriculum

def top_up_students():
    curriculum = generate_curriculum()
    students = Student.objects.all()
    marks_created = 0
    
    # We want ALL students to have a minimum of 4 and a maximum of 8 semesters randomly
    for student in students:
        target_sem = random.randint(4, 8)
        
        # Get existing max sem
        existing_sems = list(student.marks.values_list('semester', flat=True).distinct())
        max_existing = max(existing_sems) if existing_sems else 0
        
        # We need to fill in ANY missing semesters from 1 up to target_sem!
        for sem in range(1, target_sem + 1):
            if sem not in existing_sems:
                # Add marks for this missing semester
                branch_name = student.course
                if branch_name not in curriculum:
                    branch_name = random.choice(list(BRANCHES.keys()))
                
                courses_for_sem = curriculum[branch_name][sem]
                for c in courses_for_sem:
                     luck = random.uniform(0, 1)
                     if luck < 0.1:
                         cie = random.uniform(10, 22)
                         see = random.uniform(12, 25)
                     elif luck > 0.8:
                         cie = random.uniform(40, 50)
                         see = random.uniform(40, 50)
                     else:
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

    print(f"Top-up complete! Every single student now has between 4 and 8 FULL semesters completely filled. Total new marks injected: {marks_created}")

if __name__ == '__main__':
    top_up_students()
