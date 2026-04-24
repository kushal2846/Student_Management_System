import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sms.models import Student, SubjectMark, Course

def seed():
    print("Deleting old marks...")
    SubjectMark.objects.all().delete()

    students = list(Student.objects.all())
    if not students:
        print("No students found. Run seed_robust_data.py first.")
        return

    # Use actual courses if available, else create dummies
    courses = list(Course.objects.all())
    base_subjects = []
    if courses:
        for c in courses:
            base_subjects.append({"code": c.code, "name": c.name})
    else:
        base_subjects = [
            {"code": "CS101", "name": "INTRODUCTION TO PROGRAMMING"},
            {"code": "CS201", "name": "DATA STRUCTURES"},
            {"code": "EE101", "name": "BASIC ELECTRICAL ENGG"},
            {"code": "MA101", "name": "ENGINEERING MATHEMATICS I"},
            {"code": "PH101", "name": "ENGINEERING PHYSICS"},
            {"code": "ME101", "name": "ENGINEERING MECHANICS"},
        ]

    print(f"Assigning multi-semester marks for {len(students)} students...")
    
    marks_created = 0
    for student in students:
        # Randomize how many semesters this student has completed
        max_sem = random.choice([2, 3, 4, 5, 6, 7, 8])
        
        # A base performance for this student (e.g. they are an '80s' student or '60s' student)
        base_perf = random.randint(55, 90)

        for sem in range(1, max_sem + 1):
            # Select 4-6 subjects per semester
            num_subjects = random.randint(4, 6)
            # Add some salt to subject selection based on semester
            sem_subjects = random.sample(base_subjects, min(num_subjects, len(base_subjects)))

            # Semester variation (ups and downs)
            sem_variation = random.randint(-8, 8) 
            
            for sub in sem_subjects:
                # Subject variation
                sub_variation = random.randint(-5, 5)
                
                # Total expected marks for this subject
                expected_total = min(100, max(0, base_perf + sem_variation + sub_variation))
                
                # Split into CIE (out of 50) and SEE (out of 50) ideally, or 40/60 depending on how current code uses it.
                # In Academics.jsx, max marks seem to be assumed 100 for graph. Let's do CIE out of 50, SEE out of 50.
                cie = min(50, max(0, expected_total // 2 + random.randint(-3, 3)))
                see = min(50, max(0, expected_total - cie))
                
                credits = random.choice([3, 4, 4, 4]) # Mostly 4 credits

                SubjectMark.objects.create(
                    student=student,
                    semester=sem,
                    course_code=f"{sub['code']}-S{sem}", # to make them unique-ish per sem if using base pool
                    subject_name=f"{sub['name']} (Sem {sem})",
                    cie_marks=cie,
                    see_marks=see,
                    credits_registered=credits
                )
                marks_created += 1

    print(f"Successfully generated {marks_created} marks.")

if __name__ == "__main__":
    seed()
