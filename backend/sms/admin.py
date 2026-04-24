from django.contrib import admin
from .models import Student

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'first_name', 'last_name', 'course', 'enrollment_date')
    search_fields = ('student_id', 'first_name', 'last_name', 'email')
