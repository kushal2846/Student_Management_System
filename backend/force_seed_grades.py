import os
import django
import sys
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sms.models import Student, SubjectMark, Course

COURSES = [
    ('CS101', 'INTRODUCTION TO PROGRAMMING', 4),
    ('CS201', 'DATA STRUCTURES', 4),
    ('CS301', 'DATABASE MANAGEMENT SYSTEMS', 4),
    ('CS401', 'OPERATING SYSTEMS', 4),
    ('MA101', 'ENGINEERING MATHEMATICS I', 4),
    ('PH101', 'ENGINEERING PHYSICS', 4),
    ('HS101', 'COMMUNICATION SKILLS', 2),
    ('PR101', 'SEMESTER PROJECT', 2),
]

def force_seed_all():
    print("Deleting all existing dummy SubjectMarks to force a clean slate...")
    SubjectMark.objects.all().delete()
    
    print("Generating exactly 5 dummy grade subjects for every single student...")
    students = Student.objects.all()
    count = 0
    for student in students:
        selected = random.sample(COURSES, k=5)
        for c_code, c_name, req_credits in selected:
            # Random logic prioritizing decent marks so SGPA looks realistic but varied
            cie = round(random.uniform(30, 50), 2)
            see = round(random.uniform(30, 50), 2)
            SubjectMark.objects.create(
                student=student,
                course_code=c_code,
                subject_name=c_name,
                cie_marks=cie,
                see_marks=see,
                credits_registered=req_credits
            )
        count += 1
    print(f"Success! Created 5 detailed subject courses each for {count} students.")

if __name__ == '__main__':
    force_seed_all()
