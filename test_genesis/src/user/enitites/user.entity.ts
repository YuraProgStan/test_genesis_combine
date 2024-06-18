import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { UserRoles } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { Book } from '../../book/entities/book.entity';
import { UserDetails } from './user-details.entity';

@Entity()
@ObjectType()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: UserRoles, default: UserRoles.USER })
  @Field(() => UserRoles)
  role: UserRoles;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  @Field(() => UserStatus)
  status: UserStatus;

  @CreateDateColumn({ type: 'timestamp' })
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Field(() => Date)
  updatedAt: Date;

  @OneToOne(() => UserDetails, (userDetails) => userDetails.user, {
    cascade: true,
    onDelete: 'SET NULL', // Set userDetailsId to NULL if UserDetails is deleted
    nullable: true,
  })
  @JoinColumn({ name: 'userDetailsId' })
  @Field(() => UserDetails)
  details: UserDetails;

  @ManyToMany(() => Book, (book) => book.authors)
  @JoinTable()
  @Field(() => [Book], { nullable: 'itemsAndList' })
  books?: Book[];
}
