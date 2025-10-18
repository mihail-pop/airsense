from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User

class RegisterForm(UserCreationForm):
    email = forms.EmailField(required=True)
    full_name = forms.CharField(max_length=255, required=True)
    birth_day = forms.IntegerField(required=False, min_value=1, max_value=31)
    birth_month = forms.ChoiceField(required=False, choices=[
        ('', '---'),
        (1, 'January'), (2, 'February'), (3, 'March'), (4, 'April'),
        (5, 'May'), (6, 'June'), (7, 'July'), (8, 'August'),
        (9, 'September'), (10, 'October'), (11, 'November'), (12, 'December')
    ])
    birth_year = forms.IntegerField(required=False, min_value=1900, max_value=2500)
    timezone = forms.ChoiceField(required=False, choices=[
        ('UTC', 'UTC'),
        ('Europe/London', 'London'),
        ('Europe/Paris', 'Paris'),
        ('Europe/Berlin', 'Berlin'),
        ('Europe/Rome', 'Rome'),
        ('Europe/Madrid', 'Madrid'),
        ('Europe/Amsterdam', 'Amsterdam'),
        ('Europe/Brussels', 'Brussels'),
        ('Europe/Vienna', 'Vienna'),
        ('Europe/Prague', 'Prague'),
        ('Europe/Warsaw', 'Warsaw'),
        ('Europe/Budapest', 'Budapest'),
        ('Europe/Bucharest', 'Bucharest'),
        ('Europe/Sofia', 'Sofia'),
        ('Europe/Athens', 'Athens'),
        ('Europe/Helsinki', 'Helsinki'),
        ('Europe/Stockholm', 'Stockholm'),
        ('Europe/Oslo', 'Oslo'),
        ('Europe/Copenhagen', 'Copenhagen'),
        ('America/New_York', 'New York'),
        ('America/Chicago', 'Chicago'),
        ('America/Denver', 'Denver'),
        ('America/Los_Angeles', 'Los Angeles'),
        ('Asia/Tokyo', 'Tokyo'),
        ('Asia/Shanghai', 'Shanghai'),
        ('Asia/Kolkata', 'Mumbai'),
        ('Australia/Sydney', 'Sydney'),
    ])
    allergies = forms.MultipleChoiceField(
        choices=[
            ('alder', 'Alder Pollen'),
            ('birch', 'Birch Pollen'),
            ('grass', 'Grass Pollen'),
            ('mugwort', 'Mugwort Pollen'),
            ('olive', 'Olive Pollen'),
            ('ragweed', 'Ragweed Pollen'),
        ],
        widget=forms.CheckboxSelectMultiple,
        required=False
    )
    gdpr_consent = forms.BooleanField(required=True, label='I agree to the GDPR terms')
    
    class Meta:
        model = User
        fields = ('username', 'email', 'full_name', 'birth_day', 'birth_month', 'birth_year', 'timezone', 'allergies', 'password1', 'password2', 'gdpr_consent')
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.full_name = self.cleaned_data['full_name']
        # Combine date fields
        day = self.cleaned_data.get('birth_day')
        month = self.cleaned_data.get('birth_month')
        year = self.cleaned_data.get('birth_year')
        if day and month and year:
            from datetime import date
            try:
                user.date_of_birth = date(int(year), int(month), int(day))
            except ValueError:
                user.date_of_birth = None
        else:
            user.date_of_birth = None
        user.timezone = self.cleaned_data.get('timezone', 'UTC')
        user.allergies = self.cleaned_data['allergies']
        user.gdpr_consent = self.cleaned_data['gdpr_consent']
        if commit:
            user.save()
        return user