import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sms.models import SubjectMark, Student

student = Student.objects.first()
print("First student ID:", student.id)
print("Marks count natively:", student.marks.count())
print("Marks count via filter:", SubjectMark.objects.filter(student_id=student.id).count())
print("Marks count via broken string URL parameter ('1'): ", SubjectMark.objects.filter(student_id="1").count())
