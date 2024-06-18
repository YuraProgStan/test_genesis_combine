import { Injectable } from '@nestjs/common';
import { CacheService } from '../base-cache.service';

@Injectable()
export class GenreCacheService extends CacheService {}
