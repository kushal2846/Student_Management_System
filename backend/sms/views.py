import csv
from django.http import HttpResponse
from rest_framework import viewsets, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .permissions import IsAdminOrReadOnly
from .models import (Student, Attendance, SubjectMark, Course, Schedule,
                     Exam, Homework, Library, FinanceRecord, Announcement, CoursePlan)
from .serializers import (StudentSerializer, AttendanceSerializer, SubjectMarkSerializer,
                          CourseSerializer, ScheduleSerializer, ExamSerializer,
                          HomeworkSerializer, LibrarySerializer, FinanceRecordSerializer,
                          AnnouncementSerializer, CoursePlanSerializer)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().order_by('-enrollment_date')
    serializer_class = StudentSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student_id', 'first_name', 'last_name', 'email', 'phone', 'course']

    def get_queryset(self):
        qs = super().get_queryset()
        show_deleted = self.request.query_params.get('is_deleted', 'false').lower() == 'true'
        qs = qs.filter(is_deleted=show_deleted)
        
        semester = self.request.query_params.get('semester')
        if semester:
            qs = qs.filter(marks__semester=semester).distinct()
            
        course = self.request.query_params.get('course')
        if course:
            qs = qs.filter(course=course)
            
        return qs

    def paginate_queryset(self, queryset):
        if 'all' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def restore(self, request, pk=None):
        try:
            student = Student.objects.get(pk=pk)
            student.is_deleted = False
            student.save()
            return Response({'status': 'restored'})
        except Student.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="students.csv"'
        writer = csv.writer(response)
        writer.writerow(['Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Course', 'Enrollment Date', 'Attendance %'])
        students = self.filter_queryset(self.get_queryset())
        for s in students:
            writer.writerow([s.student_id, s.first_name, s.last_name, s.email, s.phone, s.course, s.enrollment_date, s.attendance_percentage])
        return response

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        Student.objects.filter(id__in=ids).update(is_deleted=True)
        return Response({'deleted': len(ids)})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_me(request):
    return Response({
        'username': request.user.username,
        'email': request.user.email,
        'is_staff': request.user.is_staff,
        'is_superuser': request.user.is_superuser
    })

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__student_id', 'student__first_name']

    def create(self, request, *args, **kwargs):
        student_id = request.data.get('student')
        date = request.data.get('date')
        is_present = request.data.get('is_present')

        if student_id is not None and date is not None:
            obj, created = Attendance.objects.update_or_create(
                student_id=student_id,
                date=date,
                defaults={'is_present': is_present}
            )
            serializer = self.get_serializer(obj)
            return Response(serializer.data, status=201 if created else 200)
        return super().create(request, *args, **kwargs)

    def paginate_queryset(self, queryset):
        if 'all' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

class SubjectMarkViewSet(viewsets.ModelViewSet):
    queryset = SubjectMark.objects.all()
    serializer_class = SubjectMarkSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__student_id', 'student__first_name', 'subject_name']

    def get_queryset(self):
        queryset = SubjectMark.objects.all().order_by('student__first_name', 'course_code')
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

    def paginate_queryset(self, queryset):
        if 'all' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'name', 'professor']
    def paginate_queryset(self, queryset):
        if 'all' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all().order_by('weekday', 'start_time')
    serializer_class = ScheduleSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['course__name', 'weekday', 'room']
    def paginate_queryset(self, queryset):
        if 'all' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all().order_by('date')
    serializer_class = ExamSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'course__name', 'location', 'status']
    def paginate_queryset(self, queryset):
        if 'all' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

class HomeworkViewSet(viewsets.ModelViewSet):
    queryset = Homework.objects.all().order_by('due_date')
    serializer_class = HomeworkSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'course__name', 'status']
    def paginate_queryset(self, queryset):
        if 'all' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

class LibraryViewSet(viewsets.ModelViewSet):
    queryset = Library.objects.all().order_by('title')
    serializer_class = LibrarySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'author', 'status']
    def paginate_queryset(self, queryset):
        if 'all' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

class FinanceRecordViewSet(viewsets.ModelViewSet):
    queryset = FinanceRecord.objects.all().order_by('-due_date')
    serializer_class = FinanceRecordSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__first_name', 'description', 'record_type']
    def paginate_queryset(self, queryset):
        if 'all' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all().order_by('-is_pinned', '-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'body', 'author']
    def paginate_queryset(self, queryset):
        if 'all' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)

class CoursePlanViewSet(viewsets.ModelViewSet):
    queryset = CoursePlan.objects.all().order_by('-year', 'semester')
    serializer_class = CoursePlanSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['course__name', 'semester']
    def paginate_queryset(self, queryset):
        if 'all' in self.request.query_params:
            return None
        return super().paginate_queryset(queryset)
