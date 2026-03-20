while IFS=, read -r title body labels milestone
do
 gh issue create --title "$title" --body "$body" --label "$labels"
done < issues.csv