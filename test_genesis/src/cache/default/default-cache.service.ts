import { Injectable } from '@nestjs/common';
import { CacheService } from '../base-cache.service';

@Injectable()
export class DefaultCacheService extends CacheService {}
