#!/bin/zsh

git config --global --add safe.directory /home/vscode/app
git config --global --unset commit.template
git config --global fetch.prune true
git config --global --add --bool push.autoSetupRemote true
git branch --merged|egrep -v '\*|develop|master|main'|xargs git branch -d
