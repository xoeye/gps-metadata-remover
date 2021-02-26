## How to contribute to this project

I'm hoping that devs will discover this project and will want to gradually expand this package where it falls short of their use cases.

If you would like to talk about this project, the best way is to reach me at my personal email: aleclindner@gmail.com. I check my work email, alindner@xoi.io, as well.

## What kind of changes would we like to see? 

I suspect the vast majority changes will come as people discover edge cases in the current supported formats where metadata is not removed. I will approve such PRs quickly and readily.

I'm also interested in expanding the list of formats we support. I'm happy to add any new image or video formats.

A natural question is "Why doesn't this package support other types of metadata?" and the answer is "It most certainly can." If I receive PRs supporting removing other types of metadata I would prefer they were submitted relatively piecemeal (i.e. one image/video format at a time) as I expect this functionality will be complicated to review and test. 

## Submitting PRs

Please email me before you start working on something so I can give you a thumbs-up on the idea; I wouldn't want you wasting time on something that won't be approved. When you're ready to submit a pull request, send it to [TBD](https://github.com/???). Please follow my coding conventions outlined below and use detailed commit messages.

## Testing

Obviously, all existing images must pass all tests with the new changes. I will test all PRs against my company's larger collection of test images as well. When submitting a PR, please include new test content relevant to the new feature or bugfix. Please keep videos at 3 to 4 seconds in length or shorter, as we will be checking these in to git for the time being.

## Coding conventions

  * This project uses uses single-quote strings, 2-space indents, and does not use semi-colons
  * This library uses flow typing and all new files must have flow annotation
  * My initial code is not well commented because it was developed in a time crunch but I would appreciate good comments in future contributions 
  * In general: Leave code nicer than you found it and focus on readability. Following this logic can be hard enough

All the best,
Alec