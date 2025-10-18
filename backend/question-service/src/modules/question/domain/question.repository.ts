import { getDb } from "../../../lib/mongodb-client";
import { Question } from "./question.interface";
import { ObjectId } from "mongodb";

export async function findQuestionsByDifficulty(
  difficulty: "Easy" | "Medium" | "Hard"
): Promise<Question[]> {
  const db = getDb();
  return db.collection<Question>("questions").find({ difficulty }).toArray();
}

export async function findQuestionsByTopics(
  topics: string[]
): Promise<Question[]> {
  const db = getDb();
  return db
    .collection<Question>("questions")
    .find({ tags: { $in: topics } })
    .toArray();
}

export async function findAllQuestions(): Promise<Question[]> {
  const db = getDb();
  return db.collection<Question>("questions").find({}).toArray();
}

export async function findQuestionsByTopicsAndDifficulty(
  topics: string[],
  difficulty: "Easy" | "Medium" | "Hard"
): Promise<Question[]> {
  const db = getDb();
  return db
    .collection<Question>("questions")
    .find({
      tags: { $in: topics },
      difficulty,
    })
    .toArray();
}

export async function findRandomQuestion(
  topics?: string[],
  difficulty?: "Easy" | "Medium" | "Hard"
): Promise<Question | null> {
  const db = getDb();
  const query: any = {};
  if (topics && topics.length > 0) {
    query.tags = { $in: topics };
  }
  if (difficulty) {
    query.difficulty = difficulty;
  }
  const result = await db
    .collection<Question>("questions")
    .aggregate([{ $match: query }, { $sample: { size: 1 } }])
    .toArray();
  return (result[0] as Question) || null;
}

export async function findQuestionById(id: string): Promise<Question | null> {
  const db = getDb();
  return db
    .collection<Question>("questions")
    .findOne({ _id: new ObjectId(id) as any });
}
