import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-contact',
  standalone: true,
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  imports: [FormsModule]
})
export class ContactComponent {
  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  
  constructor(private contactService: ContactService, private toastr: ToastrService) {}

  onSubmit(form: NgForm) {
    if (form.valid) {
      // Prepare form data to send to the API
      const formPayload = {
        name: this.formData.name,
        email: this.formData.email,
        number: this.formData.subject, // Using subject as number field temporarily
        text: this.formData.message
      };
      
      this.contactService.submitContactForm(formPayload).subscribe({
        next: (response) => {
          console.log('Contact form submitted successfully:', response);
          // Show success notification
          this.toastr.success('تم إرسال رسالتكم بنجاح!', 'نجاح');
          form.resetForm();
          // Reset form data
          this.formData = {
            name: '',
            email: '',
            subject: '',
            message: ''
          };
        },
        error: (error) => {
          console.error('Error submitting contact form:', error);
          // Show error notification
          this.toastr.error('حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى.', 'خطأ');
        }
      });
    } else {
      console.log('Form is invalid');
    }
  }

}