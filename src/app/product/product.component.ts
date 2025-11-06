import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, Validators } from '@angular/forms';
import { WebService } from '../web.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { HttpEventType } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  // imports: [FormsModule, CommonModule]
})
export class ProductComponent implements OnInit {

  private fb = inject(FormBuilder);
  data: any = {};
  category: any = [];
  products: any = [];
  // Make sure FormsModule is imported in your module for [(ngModel)].
  pageSize: any = 10;
  pageSizeOptions = [5, 10, 20, 50];
  productEditForm: any
  selectedFile: File | null = null;
  uploadStatus = '';
  progress = -1;
  downloading = false;
  status = '';
  selectedExcelCategory = ''

  loading = false;

  // pagination state
  page = 1;
  limit = 10;

  // filters
  userId!: number;           // set this from your auth/user context
  categoryId: number | null = null;

  // search with debounce
  searchCtrl = new FormControl<string>('', { nonNullable: true });

  // pagination meta
  total = 0;
  totalPages = 0;

  constructor(private webService: WebService, private snackBar: MatSnackBar, private dialog: MatDialog) {

    this.productEditForm = this.fb.group({
      name: ['', Validators.required],
      image: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      category_id: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      id: [[Validators.required, Validators.min(0)]]

    });
  }

  ngOnInit(): void {

    this.getAllCategory()
    this.getAllproducts()

    this.searchCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page = 1; // reset on new search
        this.getAllproducts();
      });
  }

  getAllproducts() {
    this.webService.listProducts({
      page: this.page,
      limit: this.limit,
      search: this.searchCtrl.value || ''
    }).subscribe({
      next: (res) => {
        this.products = res.products || [];
        this.total = res.pagination?.total ?? 0;
        this.totalPages = res.pagination?.totalPages ?? 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getAllCategory() {
    this.webService.listCategories().subscribe((result: any) => {
      console.log(result);
      this.category = result.products;
    });
    return this.category
  }

  form = this.fb.group({
    name: [this.data.product?.name ?? '', [Validators.required]],
    image: [this.data.product?.quantity ?? '', [Validators.required]],
    price: [this.data.product?.price ?? 0, [Validators.required, Validators.min(0)]],
    category_id: [this.data.product?.category_id ?? '', [Validators.required]],
    quantity: [this.data.product?.quantity ?? 0, [Validators.required, Validators.min(0)]],
  });

  save() {
    const payload = this.form.value;
    this.webService.createProduct(payload).subscribe((data: any) => {
      this.getAllproducts()
      this.snackBar.open(data.message, 'Close', { duration: 3000 });
    });
  }

  close() {
    //  this.ref.close(false);
  }

  // get totalPages(): number {
  //   return Math.max(1, Math.ceil((this.products?.length || 0) / this.pageSize));
  // }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.getAllproducts();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.getAllproducts();
    }
  }

  onCategoryChange(catId: number | null) {
    this.categoryId = catId;
    this.page = 1;
    this.getAllproducts();
  }

  onPageSizeChange(size: number) {
    this.limit = size;
    this.page = 1;
    this.getAllproducts();
  }

  isModalOpen = false;
  editIndex: number | null = null;

  openModal(modal: any, product: any) {
    this.productEditForm.patchValue({
      name: product.name,
      image: product.image,
      price: product.price,
      category_id: product.category_id,
      id: product.id,
      quantity: product.quantity ?? 0,
    });
    this.dialog.open(modal, {
      width: '560px',
    }); this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  get rangeStart() {
    return this.total === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }
  get rangeEnd() {
    const end = this.page * this.pageSize;
    return end > this.total ? this.total : end;
  }

  edit(product: any) {
    // Option A: patchValue (partial OK; order not strict)


    // (Optional) if some fields are disabled:
    // this.form.get('price')?.disable();  // or enable() to re-bind as editable
  }

  editProduct() {
    if (this.productEditForm.invalid) {
      this.productEditForm.markAllAsTouched();
      return;
    }
    const payload = this.productEditForm.getRawValue(); // includes disabled if any were disabled with getRawValue
    // ...send to API or update your array
    console.log(payload)
    this.webService.updateProduct(payload).subscribe((data: any) => {
      console.log(data)
      this.snackBar.open(data.message, 'Close', { duration: 3000 })
      this.getAllproducts()
      this.dialog.closeAll()
    })
  }

  deleteProduct(id: any) {
    this.webService.deleteProduct(id).subscribe((data: any) => {
      this.snackBar.open(data.message, 'close', { duration: 3000 })
      this.getAllproducts()
    })
  }

  cancel() {
    this.dialog.closeAll()
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    this.uploadStatus = '';
    this.progress = -1;
  }

  uploadFile() {
    if (!this.selectedFile) return;

    if (this.selectedExcelCategory == '') {
      this.snackBar.open('Please select a category before uploading.', 'Close', { duration: 3000 });
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('category_id', this.selectedExcelCategory);

    this.webService.uploadProductExel(formData).subscribe({
      next: (event: any) => {
        this.snackBar.open(event.message, 'Close', { duration: 3000 });
        this.webService.pollJobStatus(event.jobId).subscribe({
          next: (status) => {
            this.uploadStatus = `Job Status: ${status.state}`;
            if (status.state == 'completed') {
              this.uploadStatus += ` - Inserted: ${status.result.inserted}, Updated: ${status.result.updated}, Total Rows: ${status.total_rows}`;
              this.progress = 100;
              this.getAllproducts()
            } else if (status.state == 'failed') {
              this.uploadStatus += ` - Error: ${status.error}`;
              this.progress = -1;
            } else {
              this.progress = status.progress || -1;
            }
          }
        });
      },
      error: (err) => {
        this.uploadStatus = `❌ Upload failed: ${err.error?.error || err.message}`;
        this.progress = -1;
      }
    });
  }

  download() {
    this.downloading = true;
    this.status = 'Preparing Excel...';

    this.webService.exportProducts().subscribe({
      next: (resp) => {
        const blob = resp.body as Blob;

        // try to read filename from Content-Disposition
        const cd = resp.headers.get('Content-Disposition') || '';
        let filename = 'products-export.xlsx';
        const m = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(cd);
        if (m && m[1]) filename = m[1].replace(/['"]/g, '');

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        this.status = 'Done ✅';
        this.downloading = false;
      },
      error: (err) => {
        console.error('Export failed', err);
        // If server accidentally sent JSON error with 500, you can read it like this:
        // const reader = new FileReader();
        // reader.onload = () => console.error(reader.result);
        // reader.readAsText(err.error);
        alert('Export failed');
      }
    });
  }

  async getParet() {
    let res = await this.getAllCategory()
    console.log(res)
  }
}


