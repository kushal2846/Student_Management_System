import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sms.models import Student, SubjectMark

def seed():
    print("Clearing old marks...")
    SubjectMark.objects.all().delete()
    
    print("Creating testing students for Provisional Grade Report matching...")
    # First student matching exactly the image
    karthik, _ = Student.objects.get_or_create(
        student_id='1GA23CI402',
        defaults={
            'first_name': 'KARTHIK M S',
            'last_name': '',
            'email': 'karthik@example.com',
            'phone': '1234567890',
            'course': 'B.E. - CI',
            'enrollment_date': '2023-08-01'
        }
    )
    # Ensure properties if it already existed
    karthik.first_name = 'KARTHIK'
    karthik.last_name = 'M S'
    karthik.course = 'B.E. - CI'
    karthik.save()

    # Create marks for Karthik based on image
    karthik_marks = [
        ('22CML61', 'CLOUD COMPUTING', 41.00, 26.00, 4.00),
        ('22CML62', 'ADVANCED MACHINE LEARNING', 38.00, 30.00, 4.00),
        ('22CML63D', 'FUNDAMENTALS OF DATA SCIENCE', 42.00, 31.00, 3.00),
        ('22CML67A', 'MongoDB', 47.00, 25.00, 1.00),
        ('22CMLL66', 'ADVANCED MACHINE LEARNING LABORATORY', 43.00, 35.00, 1.00),
        ('22CMLP65', 'MAJOR PROJECT PHASE -I', 94.00, 0.00, 2.00),
        ('22EEE64A', 'ELECTRIC VEHICLE', 32.00, 27.00, 3.00),
        ('22IKSK69', 'INDIAN KNOWLEDGE SYSTEM', 92.00, 0.00, 0.00),
        ('22NSK68', 'NATIONAL SERVICE SCHEME (NSS)', 98.00, 0.00, 0.00),
        ('22UHV69', 'UNIVERSAL HUMAN VALUES', 76.00, 0.00, 0.00),
    ]

    for code, name, cie, see, credits in karthik_marks:
        SubjectMark.objects.create(
            student=karthik,
            course_code=code,
            subject_name=name,
            cie_marks=cie,
            see_marks=see,
            credits_registered=credits
        )

    # Second student for search bar test
    jane, _ = Student.objects.get_or_create(
        student_id='1GA23CS105',
        defaults={
            'first_name': 'JANE',
            'last_name': 'DOE',
            'email': 'jane@example.com',
            'phone': '0987654321',
            'course': 'B.E. - CS',
            'enrollment_date': '2023-08-01'
        }
    )
    jane.first_name = 'JANE'
    jane.last_name = 'DOE'
    jane.course = 'B.E. - CS'
    jane.save()

    jane_marks = [
        ('22CSL61', 'WEB TECHNOLOGIES', 45.00, 35.00, 4.00),
        ('22CSL62', 'COMPUTER NETWORKS', 40.00, 40.00, 4.00),
        ('22CSL63', 'SOFTWARE ENGINEERING', 48.00, 42.00, 3.00),
        ('22CSL64', 'DATA MINING', 38.00, 28.00, 3.00),
        ('22CSL65', 'PROJECT SPRINT', 95.00, 0.00, 2.00),
    ]

    for code, name, cie, see, credits in jane_marks:
        SubjectMark.objects.create(
            student=jane,
            course_code=code,
            subject_name=name,
            cie_marks=cie,
            see_marks=see,
            credits_registered=credits
        )

    print("Success! Created seed data for detailed grading.")

if __name__ == '__main__':
    seed()
