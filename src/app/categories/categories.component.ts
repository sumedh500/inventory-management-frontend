import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { WebService } from '../web.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ProductComponent } from '../product/product.component';
import { CdkTableDataSourceInput } from '@angular/cdk/table';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {

  categories: any
  loading = false;
  editing: any | null = null;
  displayedColumns: string[] = ['name', 'description', 'actions'];
  // dataSource: CdkTableDataSourceInput<Category> = [];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['']
  });

  constructor(private api: WebService, private fb: FormBuilder, private snack: MatSnackBar, private router: Router) { }

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading = true;
    this.api.listCategories().subscribe({
      next: (rows: any) => { this.categories = rows.products; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  startCreate() {
    this.editing = null;
    this.form.reset({ name: '', description: '' });
  }

  startEdit(cat: any) {
    this.editing = cat;
    this.form.reset({ name: cat.name, description: cat.description || '' });
  }

  save() {
    if (this.form.invalid) return;
    const payload = this.form.value;
    if (this.editing) {
      this.api.updateCategory(this.editing.id, payload).subscribe((data: any) => {
        if (data.status == 200) {
          this.snack.open(data.message, 'Close', { duration: 3000 });
        } else {
          this.snack.open(data.message, 'Close', { duration: 3000 });
        }
        this.refresh();

      });
    } else {
      this.api.createCategory(payload).subscribe(((data: any) => {
        this.snack.open(data.message, 'Close', { duration: 3000 });
        this.refresh();

      }));
    }
  }

  remove(cat: any) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    this.api.deleteCategory(cat.id).subscribe(() => this.refresh());
  }

  addProduct() {
    // this.parent.close()
    this.router.navigate(['/product']); // redirect to /products
  }



}
