import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AdminComponent } from './admin';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve([])
  });

  beforeEach(async () => {
    vi.stubGlobal('fetch', fetchMock);
    await TestBed.configureTestingModule({
        imports: [AdminComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});