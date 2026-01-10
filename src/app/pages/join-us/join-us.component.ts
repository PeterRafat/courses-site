import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-join-us',
  standalone: true,
  templateUrl: './join-us.component.html',
  styleUrls: ['./join-us.component.css'],
  imports: [FormsModule]
})
export class JoinUsComponent {
  formData = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };
  
  constructor(private contactService: ContactService, private toastr: ToastrService) {}

  onSubmit(form: NgForm) {
    if (form.valid) {
      // Prepare form data to send to the API
      const formPayload = {
        name: this.formData.name,
        email: this.formData.email,
        number: this.formData.phone, // Using phone as number field
        text: this.formData.message
      };
      
      this.contactService.submitContactForm(formPayload).subscribe({
        next: (response) => {
          console.log('Join Us form submitted successfully:', response);
          // Show success notification
          this.toastr.success('تم تقديم طلبكم بنجاح!', 'نجاح');
          form.resetForm();
          // Reset form data
          this.formData = {
            name: '',
            email: '',
            phone: '',
            message: ''
          };
        },
        error: (error) => {
          console.error('Error submitting join us form:', error);
          // Show error notification
          this.toastr.error('حدث خطأ أثناء تقديم الطلب، يرجى المحاولة مرة أخرى.', 'خطأ');
        }
      });
    } else {
      console.log('Form is invalid');
    }
  }

}