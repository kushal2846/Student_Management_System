from django.db import models
from django.utils import timezone

class Student(models.Model):
    student_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    course = models.CharField(max_length=100)
    enrollment_date = models.DateField()
    document = models.FileField(upload_to='student_documents/', null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    @property
    def attendance_percentage(self):
        total = self.attendances.count()
        if total == 0:
            return 0.0
        present = self.attendances.filter(is_present=True).count()
        return round((present / total) * 100, 2)

    @property
    def average_marks(self):
        marks_list = list(self.marks.all())
        if not marks_list:
            return 0.0
        total = sum(m.total_marks for m in marks_list)
        return round(total / len(marks_list), 2)

    @property
    def sgpa(self):
        valid_marks = [m for m in self.marks.all() if m.credits_registered > 0]
        total_credits = sum(m.credits_registered for m in valid_marks)
        if total_credits == 0: return 0.0
        total_points = sum((m.credits_registered * m.grade_point) for m in valid_marks)
        return round(total_points / total_credits, 2)

    @property
    def cgpa(self):
        return self.sgpa

    @property
    def current_semester(self):
        sems = list(self.marks.values_list('semester', flat=True).distinct())
        if not sems:
            return 1
        return max(sems)

    @property
    def grade_letter(self):
        avg = self.average_marks
        if avg >= 90: return 'A'
        if avg >= 80: return 'B'
        if avg >= 70: return 'C'
        if avg >= 60: return 'D'
        if avg >= 40: return 'E'
        if avg > 0: return 'F'
        return '-'

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"

class Attendance(models.Model):
    student = models.ForeignKey(Student, related_name='attendances', on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    is_present = models.BooleanField(default=True)

    class Meta:
        unique_together = ('student', 'date')

class SubjectMark(models.Model):
    student = models.ForeignKey(Student, related_name='marks', on_delete=models.CASCADE)
    semester = models.IntegerField(default=1)
    course_code = models.CharField(max_length=20, default='CODE')
    subject_name = models.CharField(max_length=150)
    cie_marks = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    see_marks = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    credits_registered = models.IntegerField(default=4)

    @property
    def total_marks(self):
        return round(float(self.cie_marks) + float(self.see_marks), 2)

    @property
    def grade(self):
        t = self.total_marks
        if self.credits_registered == 0: return 'PP'
        if t >= 90: return 'O'
        if t >= 80: return 'A+'
        if t >= 70: return 'A'
        if t >= 60: return 'B+'
        if t >= 50: return 'B'
        if t >= 45: return 'C'
        if t >= 40: return 'P'
        return 'F'

    @property
    def grade_point(self):
        mapping = {'O':10, 'A+':9, 'A':8, 'B+':7, 'B':6, 'C':5, 'P':4, 'F':0, 'PP':0}
        return mapping.get(self.grade, 0)

    @property
    def credits_earned(self):
        if self.grade == 'F': return 0
        return self.credits_registered

# ── NEW PORTAL MODELS ──────────────────────────────────────────────────

class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)
    professor = models.CharField(max_length=100)
    days = models.CharField(max_length=100)  # e.g. "Monday & Wednesday"
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=80)
    color = models.CharField(max_length=20, default='blue')  # for card color

    def __str__(self):
        return f"{self.code} - {self.name}"

class Schedule(models.Model):
    DAYS = [('Mon','Monday'),('Tue','Tuesday'),('Wed','Wednesday'),('Thu','Thursday'),('Fri','Friday')]
    student = models.ForeignKey(Student, related_name='schedules', on_delete=models.CASCADE, null=True, blank=True)
    course = models.ForeignKey(Course, related_name='schedules', on_delete=models.CASCADE)
    weekday = models.CharField(max_length=3, choices=DAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=80)

    def __str__(self):
        return f"{self.course.name} - {self.weekday}"

class Exam(models.Model):
    STATUS = [('Upcoming','Upcoming'),('Completed','Completed'),('Cancelled','Cancelled')]
    course = models.ForeignKey(Course, related_name='exams', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS, default='Upcoming')

    def __str__(self):
        return f"{self.name} - {self.date}"

class Homework(models.Model):
    STATUS = [('Pending','Pending'),('Submitted','Submitted'),('Overdue','Overdue')]
    course = models.ForeignKey(Course, related_name='homeworks', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS, default='Pending')

    def __str__(self):
        return f"{self.title} - {self.course.code}"

class Library(models.Model):
    STATUS = [('Available','Available'),('Borrowed','Borrowed'),('Returned','Returned')]
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=30, blank=True)
    borrowed_by = models.ForeignKey(Student, related_name='library_books', on_delete=models.SET_NULL, null=True, blank=True)
    borrow_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='Available')

    def __str__(self):
        return self.title

class FinanceRecord(models.Model):
    TYPE = [('Fee','Fee'),('Fine','Fine'),('Scholarship','Scholarship')]
    student = models.ForeignKey(Student, related_name='finance_records', on_delete=models.CASCADE)
    description = models.CharField(max_length=200)
    record_type = models.CharField(max_length=20, choices=TYPE, default='Fee')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid = models.BooleanField(default=False)
    due_date = models.DateField()

    def __str__(self):
        return f"{self.student} - {self.description}"

class Announcement(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    author = models.CharField(max_length=100, default='Admin')
    created_at = models.DateTimeField(default=timezone.now)
    is_pinned = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class CoursePlan(models.Model):
    SEMESTER = [('Fall','Fall'),('Spring','Spring'),('Summer','Summer')]
    student = models.ForeignKey(Student, related_name='course_plans', on_delete=models.CASCADE, null=True, blank=True)
    course = models.ForeignKey(Course, related_name='plans', on_delete=models.CASCADE)
    semester = models.CharField(max_length=10, choices=SEMESTER)
    year = models.IntegerField()
    completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.course.code} - {self.semester} {self.year}"
