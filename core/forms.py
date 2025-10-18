from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User

class RegisterForm(UserCreationForm):
    email = forms.EmailField(required=True)
    full_name = forms.CharField(max_length=255, required=True)
    age = forms.IntegerField(required=False, min_value=1, max_value=120)
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
        fields = ('username', 'email', 'full_name', 'age', 'allergies', 'password1', 'password2', 'gdpr_consent')
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.full_name = self.cleaned_data['full_name']
        user.age = self.cleaned_data['age']
        user.allergies = self.cleaned_data['allergies']
        user.gdpr_consent = self.cleaned_data['gdpr_consent']
        if commit:
            user.save()
        return user