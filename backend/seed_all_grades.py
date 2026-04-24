import os
import django
import sys
import random

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sms.models import Student, SubjectMark

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

def seed_all():
    print("Generating dummy grade data for all students...")
    students = Student.objects.all()
    count = 0
    for student in students:
        # Check if student already has marks
        if student.marks.count() == 0:
            count += 1
            # Give them 5 random courses
            selected = random.sample(COURSES, k=5)
            for c_code, c_name, req_credits in selected:
                cie = round(random.uniform(25, 50), 2)
                see = round(random.uniform(25, 50), 2)
                SubjectMark.objects.create(
                    student=student,
                    course_code=c_code,
                    subject_name=c_name,
                    cie_marks=cie,
                    see_marks=see,
                    credits_registered=req_credits
                )
    print(f"Success! Created random dummy grades for {count} students.")

if __name__ == '__main__':
    seed_all()
