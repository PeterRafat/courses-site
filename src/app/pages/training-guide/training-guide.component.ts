import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-training-guide',
  standalone: true,
  templateUrl: './training-guide.component.html',
  styleUrls: ['./training-guide.component.css'],
  imports: [RouterLink, CommonModule]
})
export class TrainingGuideComponent {

}