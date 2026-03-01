import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { InternalRecipeService } from './internal-recipe.service';

describe('InternalRecipeService', () => {
  let service: InternalRecipeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(InternalRecipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
