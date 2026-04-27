export interface QueueAck {
  jobId:  string | undefined;
  queued: boolean;
}

export interface PostJobData {
  id?:       number;
  title?:    string;
  body?:     string;
  authorId?: number;
}

export interface UserJobData {
  id?:    number;
  name?:  string;
  email?: string;
}

export interface CommentJobData {
  id?:       number;
  text?:     string;
  postId?:   number;
  authorId?: number;
}
