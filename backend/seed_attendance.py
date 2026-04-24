import os
import django
import sys
import random
import datetime
from django.utils import timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from sms.models import Student, Attendance

def seed_attendance():
    students = Student.objects.all()
    today = timezone.now().date()
    
    # Generate past 45 days of classes
    business_days = []
    current = today - datetime.timedelta(days=60)
    while current <= today:
        if current.weekday() < 5: # Monday to Friday
            business_days.append(current)
        current += datetime.timedelta(days=1)
        
    print(f"Seeding attendance for {students.count()} students over {len(business_days)} days...")
    
    # Fast bulk insert
    attendance_objects = []
    
    for student in students:
        # Give each student a different base tendency (some always present, some chronic absentees)
        tendency = random.uniform(0.3, 0.98) 
        
        # We don't want to overpopulate for students who just enrolled, but for the sake of visuals, we just use 45 days.
        existing_dates = set(student.attendances.values_list('date', flat=True))
        
        for date in business_days:
            if date not in existing_dates:
                is_p = random.random() < tendency
                attendance_objects.append(Attendance(student=student, date=date, is_present=is_p))
                
                # Commit in chunks to save memory
                if len(attendance_objects) > 5000:
                    Attendance.objects.bulk_create(attendance_objects)
                    attendance_objects = []
                    
    if attendance_objects:
        Attendance.objects.bulk_create(attendance_objects)
    
    print("Done! Completely filled complex attendance patterns globally.")

if __name__ == '__main__':
    seed_attendance()
