const gitlog = require("gitlog").default;
const momentJs = require("moment");
const fs = require("fs");

// source: https://github.com/domharrington/node-gitlog
interface CommitMetaData {
  hash?: string;
  abbrevHash?: string;
  treeHash?: string;
  abbrevTreeHash?: string;
  parentHashes?: string;
  abbrevParentHashes?: string;
  authorName?: string;
  authorEmail?: string;
  authorDate?: string;
  authorDateRel?: string;
  committerName?: string;
  committerEmail?: string;
  committerDate?: string;
  committerDateRel?: string;
  subject?: string;
  status?: string[];
  files?: string[];
}

const configs: any = {
  elapsedTimeMinimum: 5, // in minutes
  elapsedTimeMaximum: 300, // in minutes
  elapsedTimeNextDayDelay: 600, // in minutes
  excludes: [
    "Merge branch",
    "Merge remote-tracking branch",
    "Merge pull request",
    "Wip",
  ],
};

const options: any = {
  repo: __dirname + "./..",
  number: 100,
  author: "Egoist",
  fields: ["subject", "authorDate"],
  // fields: ['hash', 'abbrevHash', 'subject', 'authorName', 'authorDateRel'],
  // execOptions: { maxBuffer: 1000 * 1024 },
};

const commits = gitlog(options),
  today = momentJs();

let alteredCommits = commits
  ?.map((commit: CommitMetaData) => ({
    message: commit.subject,
    dateRaw: commit.authorDate,
    dateObject: momentJs(commit.authorDate),
  }))
  .filter((commit: any) => commit.dateObject.isSame(today, "day"));

// order by date
alteredCommits?.sort((a: any, b: any) => a.dateOnject - b.dateOnject);

// remove duplicates
alteredCommits = alteredCommits?.filter(
  (commit: any, index: number, self: any[]) =>
    index === self.findIndex((x: any) => x.message === commit.message)
);

// elapsed time
alteredCommits = alteredCommits?.map(
  (commit: any, index: number, self: any[]) => {
    const nextCommit = self[index + 1],
      nextCommitDate = nextCommit?.dateObject,
      commitDate = commit.dateObject,
      diff = commitDate?.diff(nextCommitDate, "seconds"),
      diffInMinutes = Math.round(diff / 60);

    const duration = momentJs.duration(diff, "seconds"),
      elapsedTime = `${duration.hours()}:${duration.minutes()}`;

    let elapsedTimeFinal = elapsedTime;

    if (
      diffInMinutes > configs.elapsedTimeMaximum &&
      diffInMinutes < configs.elapsedTimeNextDayDelay
    ) {
      const hours: number = Math.round(parseInt(duration.hours(), 10) / 2),
        minutes: number = Math.round(parseInt(duration.minutes(), 10) / 2);

      elapsedTimeFinal = hours + ":" + (minutes > 9 ? minutes : 0);
    } else if (diffInMinutes > configs.elapsedTimeNextDayDelay) {
      elapsedTimeFinal = "1:0";
    }

    if (configs.elapsedTimeMinimum) {
      if (diffInMinutes < configs.elapsedTimeMinimum) {
        commit.elapsedTime = configs.elapsedTimeMinimum;
      }
    }

    return {
      ...commit,
      diffInMinutes,
      elapsedTime,
      isSubjectContainsFilenames:
        commit.subject?.match(/([\w+\.]+[a-z]{1,3})/g)?.length > 0,
      elapsedTimeFinal,
    };
  }
);

// remove less than 10 minute
alteredCommits = alteredCommits?.filter((commit: any) => {
  const [hours, minutes] = commit.elapsedTime.split(":");

  return hours > 0 || minutes > configs.elapsedTimeMinimum;
});

// exclude commits
alteredCommits = alteredCommits?.filter(
  (commit: any) =>
    !configs.excludes.some((exclude: string) =>
      commit.message.startsWith(exclude)
    )
);

if (!alteredCommits.length) {
  console.log("\n\n\n❌ No commits found\n\n\n");
} else {
  const logs = alteredCommits?.map(
    (commit: any) =>
      `- ${commit.message} [elapsed:${commit.elapsedTimeFinal}, date:${commit.dateRaw}]`
  );

  // generate file name
  const filePath: string = __dirname + "/logs",
    fileName: string = today.format("YYYY-MM-DD") + ".md";

  // create folder if not exists
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }

  // save to file
  fs.writeFileSync(`${filePath}/${fileName}`, logs.join("\r"), {
    encoding: "utf8",
    flag: "w",
  });

  console.log(`\n\n\n✅ Commit logs saved to file: ${fileName}\n\n\n`);
}
