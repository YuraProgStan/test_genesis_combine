import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/enitites/user.entity';
import { BookStatus } from '../enums/book-status';
import { Genre } from '../../genre/entities/genre.entity';

@Entity()
@ObjectType({ description: 'Book model' })
export class Book {
  @PrimaryGeneratedColumn()
  @Field(() => ID, { description: 'Id of the book' })
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  @Field({ description: 'Title of the book' })
  title: string;

  @Column({ type: 'text' })
  @Field({ description: 'Description of the book' })
  description: string;

  @Column({ type: 'text' })
  @Field({ description: 'Content of the book' })
  content: string;

  @Column({ type: 'enum', enum: BookStatus, default: BookStatus.DRAFT })
  @Field(() => BookStatus)
  status: BookStatus;

  @Index()
  @Column({ nullable: true })
  @Field(() => Int, { nullable: true })
  publicationYear?: number;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updatedAt: Date;

  @JoinTable()
  @ManyToMany(() => User, (user) => user.books, { nullable: true })
  @Field(type => [User], { nullable: 'itemsAndList' })
  authors: User[];

  @JoinTable()
  @ManyToMany(() => Genre, (genre) => genre.books, { cascade: true })
  genres: Genre[];
}
