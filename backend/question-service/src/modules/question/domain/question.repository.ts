/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash, date: 12 Oct 2025
Scope: Helped implement several functions according to the team's requirements and provided focused code cleanups and clarifying comments.
Author review: I validated correctness, clarified ambiguous code, and fixed minor implementation issu.
*/
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

export async function findQuestionsByIds(ids: string[]): Promise<Question[]> {
  const db = getDb();
  const objectIds = ids.map((id) => new ObjectId(id));
  const questions = await db
    .collection<Question>("questions")
    .find({ _id: { $in: objectIds } })
    .toArray();

  return questions.map((q) => ({
    ...q,
    _id: q._id?.toString(),
  }));
}

export async function findAllTopics(): Promise<string[]> {
  const db = getDb();

  // Get distinct values from both `topics` and `tags` fields to be robust
  const topicsFromField = (await db
    .collection("questions")
    .distinct("topics")) as any[];
  const tagsFromField = (await db
    .collection("questions")
    .distinct("tags")) as any[];

  const set = new Set<string>();

  // Helper to add values (handle nulls and arrays safely)
  const addValues = (arr: any[]) => {
    if (!arr || !Array.isArray(arr)) return;
    for (const v of arr) {
      if (v == null) continue;
      // If distinct returned nested arrays for some reason, flatten
      if (Array.isArray(v)) {
        for (const inner of v) {
          if (inner != null) set.add(String(inner));
        }
      } else {
        set.add(String(v));
      }
    }
  };

  addValues(topicsFromField);
  addValues(tagsFromField);

  return Array.from(set);
}
