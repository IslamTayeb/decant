# SWE-Bench Context-Stress Candidates

- Dataset: SWE-bench/SWE-bench_Verified
- Split: test
- Max candidates: 20

| Rank | Instance | Repo | Difficulty | F2P | P2P | Score | Why | Caveats |
|---:|---|---|---|---:|---:|---:|---|---|
| 1 | `pydata__xarray-6992` | pydata/xarray | >4 hours | 12 | 945 | 589.5 | difficulty >4 hours, 12 target tests, 5 touched files, substantial gold patch, substantial test patch |  |
| 2 | `django__django-11276` | django/django | 15 min - 1 hour | 26 | 548 | 548.8 | difficulty 15 min - 1 hour, 26 target tests, 15 touched files, substantial gold patch, substantial test patch | may touch generated/parser files |
| 3 | `django__django-14011` | django/django | 1-4 hours | 17 | 2 | 506.2 | difficulty 1-4 hours, 17 target tests, 4 touched files, substantial gold patch, substantial test patch | may involve heavier DB/server environment behavior |
| 4 | `django__django-16560` | django/django | 1-4 hours | 8 | 66 | 492.4 | difficulty 1-4 hours, 8 target tests, 4 touched files, substantial gold patch, substantial test patch |  |
| 5 | `django__django-16938` | django/django | 15 min - 1 hour | 23 | 65 | 486.2 | difficulty 15 min - 1 hour, 23 target tests, 8 touched files, substantial test patch, long issue text |  |
| 6 | `astropy__astropy-13977` | astropy/astropy | 15 min - 1 hour | 20 | 322 | 479.0 | difficulty 15 min - 1 hour, 20 target tests, 3 touched files, substantial gold patch, substantial test patch, long issue text |  |
| 7 | `pylint-dev__pylint-4551` | pylint-dev/pylint | 1-4 hours | 10 | 0 | 454.3 | difficulty 1-4 hours, 10 target tests, 5 touched files, substantial gold patch |  |
| 8 | `pytest-dev__pytest-5787` | pytest-dev/pytest | 1-4 hours | 2 | 123 | 447.9 | difficulty 1-4 hours, 2 target tests, 5 touched files, substantial gold patch, substantial test patch, long issue text |  |
| 9 | `django__django-14672` | django/django | 15 min - 1 hour | 168 | 0 | 441.9 | difficulty 15 min - 1 hour, 168 target tests, 4 touched files, long issue text |  |
| 10 | `astropy__astropy-13398` | astropy/astropy | 1-4 hours | 4 | 68 | 440.6 | difficulty 1-4 hours, 4 target tests, 5 touched files, substantial gold patch, substantial test patch, long issue text |  |
| 11 | `pylint-dev__pylint-4604` | pylint-dev/pylint | 15 min - 1 hour | 21 | 0 | 405.3 | difficulty 15 min - 1 hour, 21 target tests, 3 touched files |  |
| 12 | `sympy__sympy-16597` | sympy/sympy | 1-4 hours | 3 | 74 | 404.3 | difficulty 1-4 hours, 3 target tests, 8 touched files, substantial gold patch, substantial test patch | may involve heavier DB/server environment behavior, may touch generated/parser files |
| 13 | `sympy__sympy-13878` | sympy/sympy | >4 hours | 1 | 19 | 396.0 | difficulty >4 hours, substantial gold patch, substantial test patch, long issue text | binary target-test signal |
| 14 | `django__django-11400` | django/django | 1-4 hours | 6 | 58 | 385.9 | difficulty 1-4 hours, 6 target tests, 5 touched files, substantial gold patch, substantial test patch |  |
| 15 | `django__django-13212` | django/django | 1-4 hours | 5 | 2 | 383.0 | difficulty 1-4 hours, 5 target tests, 3 touched files, substantial gold patch, substantial test patch |  |
| 16 | `sphinx-doc__sphinx-7590` | sphinx-doc/sphinx | >4 hours | 1 | 24 | 370.0 | difficulty >4 hours, 4 touched files, substantial gold patch | binary target-test signal |
| 17 | `sphinx-doc__sphinx-9461` | sphinx-doc/sphinx | 1-4 hours | 3 | 59 | 369.4 | difficulty 1-4 hours, 3 target tests, 7 touched files, substantial gold patch, substantial test patch |  |
| 18 | `django__django-13128` | django/django | 1-4 hours | 7 | 134 | 366.8 | difficulty 1-4 hours, 7 target tests, substantial gold patch, substantial test patch |  |
| 19 | `astropy__astropy-14369` | astropy/astropy | 1-4 hours | 3 | 732 | 363.8 | difficulty 1-4 hours, 3 target tests, 3 touched files, substantial gold patch |  |
| 20 | `django__django-13344` | django/django | 1-4 hours | 2 | 356 | 362.5 | difficulty 1-4 hours, 2 target tests, 6 touched files, substantial gold patch, substantial test patch |  |
