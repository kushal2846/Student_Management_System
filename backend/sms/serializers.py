from rest_framework import serializers
from .models import (Student, Attendance, SubjectMark, Course, Schedule,
                     Exam, Homework, Library, FinanceRecord, Announcement, CoursePlan)

class StudentSerializer(serializers.ModelSerializer):
    attendance_percentage = serializers.ReadOnlyField()
    average_marks = serializers.ReadOnlyField()
    sgpa = serializers.ReadOnlyField()
    cgpa = serializers.ReadOnlyField()
    grade_letter = serializers.ReadOnlyField()
    current_semester = serializers.ReadOnlyField()
    class Meta:
        model = Student
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'

class SubjectMarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    student_id_str = serializers.CharField(source='student.student_id', read_only=True)
    total_marks = serializers.ReadOnlyField()
    grade = serializers.ReadOnlyField()
    grade_point = serializers.ReadOnlyField()
    credits_earned = serializers.ReadOnlyField()
    student_branch = serializers.CharField(source='student.course', read_only=True)
    class Meta:
        model = SubjectMark
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class ScheduleSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    class Meta:
        model = Schedule
        fields = '__all__'

class ExamSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    class Meta:
        model = Exam
        fields = '__all__'

class HomeworkSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_color = serializers.CharField(source='course.color', read_only=True)
    class Meta:
        model = Homework
        fields = '__all__'

class LibrarySerializer(serializers.ModelSerializer):
    borrowed_by_name = serializers.SerializerMethodField()
    def get_borrowed_by_name(self, obj):
        if obj.borrowed_by:
            return f"{obj.borrowed_by.first_name} {obj.borrowed_by.last_name}"
        return None
    class Meta:
        model = Library
        fields = '__all__'

class FinanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
    class Meta:
        model = FinanceRecord
        fields = '__all__'

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = '__all__'

class CoursePlanSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    class Meta:
        model = CoursePlan
        fields = '__all__'
