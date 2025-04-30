#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import argparse


def scrape_indeed_job(url):
    # Use realistic headers to avoid 403 from Indeed
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    response = requests.get(url, headers=headers)
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