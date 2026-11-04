import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { Lesson } from './lesson';
import { checkCourseAgainstLessons, formatPath, validateCourse, validateLesson } from './validate-lesson';

/** The real lesson files must validate with no errors and no readability warnings. */
const CONTENT = fileURLToPath(new URL('../../../../content', import.meta.url));
const read = (file: string): unknown => parse(readFileSync(file, 'utf8'));
const describeIssues = (issues: readonly { path: readonly (string | number)[]; message: string }[]) =>
  issues.map((i) => `${formatPath(i.path)}: ${i.message}`);

const lessonFiles = readdirSync(join(CONTENT, 'lessons')).filter((f) => f.endsWith('.yaml'));

describe('content/', () => {
  it.each(lessonFiles)('%s is valid and readable', (file) => {
    const result = validateLesson(read(join(CONTENT, 'lessons', file)), {
      expectedId: basename(file, '.yaml'),
    });
    expect(describeIssues(result.issues)).toEqual([]);
  });

  it('course.yaml is valid and matches the lesson files', () => {
    const course = validateCourse(read(join(CONTENT, 'course.yaml')));
    expect(describeIssues(course.issues)).toEqual([]);
    const lessons = lessonFiles.map((f) => read(join(CONTENT, 'lessons', f)) as Lesson);
    if (!course.value) throw new Error('course.yaml did not validate');
    expect(describeIssues(checkCourseAgainstLessons(course.value, lessons))).toEqual([]);
    const ready = course.value.lessons.filter((l) => l.status === 'ready').map((l) => l.id);
    expect(ready.toSorted()).toEqual(lessonFiles.map((f) => basename(f, '.yaml')).toSorted());
  });
});
