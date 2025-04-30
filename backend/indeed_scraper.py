#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import argparse


def scrape_indeed_job(url):
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    # Try standard Indeed job description containers
    desc = soup.find('div', id='jobDescriptionText')
    if not desc:
        desc = soup.find('div', class_='jobsearch-jobDescriptionText')
    text = desc.get_text(separator='\n', strip=True) if desc else ''
    return text


def main():
    parser = argparse.ArgumentParser(description='Scrape job description from Indeed')
    parser.add_argument('url', help='Indeed job URL')
    parser.add_argument('--output', '-o', default='job_description.txt', help='Output filename')
    args = parser.parse_args()
    description = scrape_indeed_job(args.url)
    with open(args.output, 'w', encoding='utf-8') as f:
        f.write(description)
    print(f'Saved job description to {args.output}')


if __name__ == '__main__':
    main() 