---
difficulty: intermediate
connectionType: mathematical_foundation
keywords: 부트스트래핑, 재표본, 복원 추출, 배깅, 랜덤 포레스트, 앙상블 학습, 신뢰 구간
keywords_en: bootstrapping, resampling, sampling with replacement, bagging, random forest, ensemble learning, confidence interval
---
Bootstrapping (Efron 1979) - 하나의 표본에서 복원 추출로 수천 개의 가상 표본을 만들어 통계량의 분포를 추정하는 재표본 기법

## 문제 -- 표본 하나로 무엇을 알 수 있는가

전국민의 평균 소득을 알고 싶지만 5,000만 명 전부를 조사할 수는 없다. 그래서 1,000명을 뽑아 평균을 구한다. 이 평균이 350만 원이라고 하자. 한 가지 불안이 남는다. 다른 1,000명을 뽑았다면 결과가 얼마나 달라졌을까?

전통 통계학은 이 불확실성을 수학 공식으로 해결한다. 중심극한정리에 따르면 표본 평균의 분포는 정규분포에 가까워지고, 표준오차 공식 sigma/sqrt(n)으로 흔들림의 크기를 계산할 수 있다. 하지만 이 공식이 통하는 건 평균처럼 단순한 통계량에 한정된다. 중앙값, 상관계수, 회귀 계수의 비(ratio) 같은 복잡한 통계량은 분포의 수학적 공식을 유도하기가 매우 어렵거나 불가능하다. 1970년대 통계학자들은 이 벽 앞에 서 있었다.

## 에프론의 아이디어 -- 표본을 모집단처럼 쓴다

1979년, 스탠퍼드의 통계학자 Bradley Efron은 "Bootstrap Methods: Another Look at the Jackknife"라는 논문에서 놀랍도록 단순한 해법을 제시했다. 핵심 아이디어는 이것이다. **원래 표본 자체를 모집단의 축소판으로 취급한다.**

구체적인 절차를 따라가 보자. 1,000명의 데이터가 담긴 상자가 있다. 여기서 한 명을 뽑아 기록하고, **다시 상자에 넣는다**(복원 추출). 이를 1,000번 반복하면 가상 표본 하나가 만들어진다. 복원 추출이므로 같은 사람이 두세 번 뽑힐 수도 있고, 한 번도 안 뽑히는 사람도 있다. 이 가상 표본에서 원하는 통계량을 계산한다. 이 과정을 수천 번 반복하면 통계량의 값이 수천 개 모인다. 이 값들의 분포가 바로 **부트스트랩 분포**이며, 실제 표본 분포의 근사치가 된다.

이름은 "자기 구두끈(bootstrap)을 잡아당겨 자기를 들어올린다"는 뮌히하우젠 남작의 허풍에서 왔다. **데이터 자신의 힘으로** 불확실성을 측정하겠다는 발상이 그만큼 역설적이었기 때문이다.

## 복원 추출의 수학적 근거

직관적 비유를 들어 보자. 같은 재료와 레시피로 케이크를 100번 구우면 매번 맛이 조금씩 다르다. 오븐 온도, 계란 크기, 섞는 횟수의 미세한 차이가 결과를 흔든다. 100개의 맛 분포를 보면 "이 레시피의 맛은 대략 이 범위"라고 말할 수 있다. 부트스트래핑도 같은 원리다. 복원 추출로 만든 가상 표본들은, 모집단에서 여러 번 표본을 뽑는 것의 대리인이다.

수학적 핵심 성질이 하나 있다. 복원 추출 시 각 관측값이 한 번도 안 뽑힐 확률은 (1 - 1/n)^n이며, n이 크면 1/e ≈ 0.368에 수렴한다. 즉, 각 가상 표본은 원래 데이터의 약 **63.2%**만 포함하고 **36.8%**는 빠진다. 이 빠진 데이터가 가상 표본마다 구성을 다르게 만들고, 통계량의 변동을 자연스럽게 반영한다. 이 36.8% 성질은 나중에 기계학습에서 결정적인 역할을 한다.

비복원 추출이면 어떻게 될까? 매번 같은 1,000명이 뽑히므로 통계량도 매번 같다. **복원**이 핵심인 이유다.

## 통계학에서의 혁명적 영향

부트스트래핑은 발표 직후 격렬한 논쟁을 일으켰다. "데이터에서 정보를 무에서 창조하는 것 아닌가?"라는 의구심이었다. 하지만 Efron은 부트스트랩 분포가 표본 분포의 **일관적(consistent) 추정량**임을 증명했다. n이 커지면 부트스트랩 분포가 실제 표본 분포에 수렴한다.

이후 부트스트래핑은 통계학 실무 전반으로 확산되었다. 수학적 공식 없이 **신뢰 구간**을 구할 수 있게 된 것이다. 부트스트랩 분포의 2.5번째와 97.5번째 백분위수를 취하면 95% 신뢰 구간이 된다. 분포 가정도, 복잡한 유도도 필요 없다. 가설 검정, 회귀 계수의 표준 오차, 비모수 추정 등 공식이 복잡한 거의 모든 상황에서 범용 도구로 자리잡았다.

## 배깅과 랜덤 포레스트 -- 기계학습으로의 직접 연결

부트스트래핑이 AI에 영향을 준 가장 직접적인 경로는 Leo Breiman이 1996년에 발표한 **배깅(Bagging, Bootstrap AGGregatING)**이다. Breiman의 아이디어는 명쾌하다. 부트스트랩으로 여러 개의 학습 데이터셋을 만들고, 각각에 모델을 학습시킨 뒤, 예측을 평균(회귀)하거나 투표(분류)한다.

왜 이것이 작동하는가? 핵심은 **분산 감소**다. 비유를 들면, 하나의 전문가에게 경제 전망을 물으면 그 사람의 편향이 그대로 반영된다. 하지만 100명의 독립적인 전문가에게 물어 평균을 내면, 개인의 편향은 서로 상쇄되고 합의에 가까운 답이 남는다. 이것이 "군중의 지혜(wisdom of crowds)"이며, 배깅의 수학적 본질이다. n개 모델의 분산은 원래 모델 분산의 1/n에 가깝다(모델이 독립적일수록).

Breiman은 2001년에 한 발 더 나아갔다. **랜덤 포레스트(Random Forest)**는 배깅에 특징 랜덤 선택을 추가한 것이다. 각 결정 트리를 학습할 때, 분기마다 전체 특징이 아닌 무작위 부분집합만 후보로 놓는다. 부트스트랩이 훈련 데이터의 다양성을 만든다면, 랜덤 특징 선택은 트리 구조의 다양성을 만든다. 이 이중 랜덤화가 트리 간 상관관계를 줄여서, 단순 배깅보다 더 큰 분산 감소를 달성한다.

여기서 복원 추출의 36.8% 성질이 빛난다. **Out-of-Bag(OOB) 평가**라는 기법이다. 각 부트스트랩 표본에서 빠진 36.8%의 데이터로 해당 모델의 성능을 검증할 수 있다. 모든 모델에 대해 이를 종합하면 별도의 검증 셋 없이도 모델 성능을 추정할 수 있다. 데이터가 부족한 상황에서 이 성질은 특히 값지다.

## 현대 AI에서의 확장

부트스트래핑의 "데이터의 부분 집합을 무작위로 선택하여 다양성을 만든다"는 핵심 원리는 현대 AI 곳곳에서 변형되어 살아 있다.

**통계적 원리의 직접적 적용:**

- **모델 앙상블**: 여러 신경망의 예측을 결합하여 정확도를 높이고 **불확실성을 추정**한다. 5개 신경망의 예측이 비슷하면 확신이 높고, 크게 갈리면 불확실성이 높다. 의료 진단이나 자율주행처럼 "모른다"고 말할 수 있어야 하는 분야에서 중요하다.
- **XGBoost와 LightGBM의 서브샘플링**: 각 반복에서 전체 데이터 대신 무작위 부분집합을 사용하는 것은 부트스트래핑의 직접적 변형이다. 과적합 방지와 계산 효율을 동시에 달성한다.

**같은 직관을 공유하는 구조적 유사성:**

- **드롭아웃(Dropout)**: Gal & Ghahramani(2016)는 훈련 중 뉴런을 무작위로 비활성화하는 드롭아웃이 근사적 베이지안 추론으로 해석될 수 있음을 보였다. "무작위 부분집합을 반복 선택한다"는 원리를 공유하지만, 역사적으로 부트스트래핑에서 영감을 받은 것은 아니다.
- **데이터 증강(Data Augmentation)**: 이미지 회전, 자르기, 색상 변환 등으로 학습 데이터의 변형을 만드는 것은 "적은 데이터에서 더 많은 다양성을 만든다"는 부트스트래핑의 정신적 친척이다. 다만 기술적으로는 완전히 다른 방법이다.

## 한계와 약점

부트스트래핑은 거의 만능처럼 보이지만 분명한 한계가 있다.

- **원래 표본의 대표성 의존**: 표본이 모집단을 잘 대표하지 않으면 부트스트랩 분포도 편향된다. 편향된 설문조사를 10,000번 복원 추출해도 편향은 사라지지 않는다.
- **극단값 통계량에 부적합**: 최대값이나 최소값처럼 극단에 의존하는 통계량은 복원 추출로 잘 근사되지 않는다. 원래 데이터의 최대값은 가상 표본에서 최대값 이하가 될 수밖에 없기 때문이다.
- **데이터 간 의존성**: 시계열 데이터처럼 관측값 사이에 시간적 순서나 상관관계가 있으면 단순 부트스트랩은 이 구조를 깨뜨린다. 블록 부트스트랩(block bootstrap)처럼 의존성을 보존하는 변형이 필요하다.
- **계산 비용**: 가상 표본 생성과 통계량 계산을 수천~수만 번 반복해야 하므로, 대규모 데이터에서는 상당한 연산 시간이 소요된다. 컴퓨터 성능의 향상이 없었다면 실용화가 어려웠을 것이다.

## 용어 정리

부트스트래핑(bootstrapping) - 하나의 표본에서 복원 추출로 가상 표본을 반복 생성하여 통계량의 분포를 경험적으로 추정하는 방법. Efron(1979)

복원 추출(sampling with replacement) - 한 번 뽑은 데이터를 되돌려 놓고 다시 뽑는 표본 추출 방식. 같은 데이터가 여러 번 선택될 수 있음

신뢰 구간(confidence interval) - 모수의 참값이 포함될 것으로 기대되는 값의 범위. 예: 95% 신뢰 구간은 동일한 추정을 100번 반복하면 약 95번은 참값을 포함하는 구간

배깅(bagging, bootstrap aggregating) - 부트스트랩 표본으로 여러 모델을 학습시키고 예측을 결합하는 앙상블 기법. Breiman(1996)

랜덤 포레스트(random forest) - 배깅에 무작위 특징 선택을 추가한 결정 트리 앙상블. 이중 랜덤화로 트리 간 상관관계를 줄여 분산 감소 효과를 극대화. Breiman(2001)

Out-of-Bag(OOB) - 각 부트스트랩 표본에서 빠진 약 36.8%의 데이터로 해당 모델의 성능을 검증하는 기법. 별도 검증 셋 불필요

앙상블(ensemble) - 여러 모델의 예측을 결합하여 단일 모델보다 나은 성능을 얻는 전략의 총칭

분산 감소(variance reduction) - 독립적인 여러 추정값의 평균을 내면 개별 추정의 변동이 줄어드는 통계적 원리

---EN---
Bootstrapping (Efron 1979) - A resampling technique that generates thousands of virtual samples through sampling with replacement from a single sample to estimate the distribution of statistics

## The Problem -- What Can One Sample Tell Us

You want to know the average income of an entire nation, but surveying all 50 million people is impossible. So you randomly sample 1,000 people and calculate the mean. Say it turns out to be 3.5 million won. One nagging question remains: how different would the result have been with a different 1,000 people? Is 3.5 million within 100,000 of the true mean, or 500,000 off? You cannot tell.

Traditional statistics addresses this uncertainty with mathematical formulas. The Central Limit Theorem says the sampling distribution of the mean approaches a normal distribution, and the standard error formula sigma/sqrt(n) quantifies the fluctuation. But this clean formula only works for simple statistics like the mean. For complex statistics -- the median, correlation coefficients, ratios of regression coefficients -- deriving the mathematical distribution is extremely difficult or impossible. In the 1970s, statisticians stood before this wall.

## Efron's Idea -- Treating the Sample as Its Own Population

In 1979, Stanford statistician Bradley Efron proposed a remarkably simple solution in his paper "Bootstrap Methods: Another Look at the Jackknife." The core idea: **treat the original sample itself as a miniature of the population.**

Follow the procedure step by step. You have a box containing data from the original 1,000 people. Draw one person, record them, and **put them back** (sampling with replacement). Repeat 1,000 times to create one virtual sample of 1,000. Because of replacement, the same person can be drawn two or three times, while others may never appear. Compute your desired statistic (mean, median, correlation, etc.) on this virtual sample. Repeat the entire process 1,000, 5,000, or 10,000 times. The resulting thousands of statistic values form the **bootstrap distribution** -- an approximation of the true sampling distribution.

The name has a delightful origin. It comes from the tale of Baron Munchausen, who pulled himself out of a swamp by his own bootstraps. Using **data's own power** to measure its own uncertainty seemed just as paradoxical.

## The Mathematical Foundation of Resampling

To intuitively grasp why bootstrapping works, consider an analogy. Bake a cake 100 times with the same ingredients and recipe, and each cake tastes slightly different. Subtle oven temperature variation, egg size differences, and mixing inconsistencies all create fluctuation. The distribution of 100 cake flavors tells you "cakes from this recipe generally fall within this range." Bootstrapping works on the same principle. Virtual samples created by resampling from the original sample act as proxies for repeatedly drawing new samples from the true population.

One mathematical property is key. The probability that a given observation is never drawn in a resample is (1 - 1/n)^n. For large n, this converges to 1/e, approximately 0.368. Each virtual sample therefore contains roughly **63.2%** of the original data, with the remaining **36.8%** left out. This absence makes every virtual sample compositionally different, naturally reflecting variability in the statistic. This 36.8% property later plays a decisive role in machine learning.

What if sampling were without replacement? Every draw would yield the same 1,000 people, producing the identical statistic every time. **Replacement** is what makes bootstrapping work.

## A Revolution in Statistics

Bootstrapping ignited fierce debate upon publication. Critics asked, "Isn't this creating information from nothing?" But Efron proved theoretically that the bootstrap distribution is a **consistent estimator** of the sampling distribution -- as sample size n grows, the bootstrap distribution converges to the true sampling distribution.

After this validation, bootstrapping spread rapidly across statistical practice. **Confidence intervals** could now be obtained without mathematical formulas: take the 2.5th and 97.5th percentiles of the bootstrap distribution for a 95% interval. No distributional assumptions, no complex derivations needed. For hypothesis testing, standard errors of regression coefficients, nonparametric estimation -- virtually any situation where formulas were unavailable or intractable -- bootstrapping became the universal tool.

## Bagging and Random Forests -- The Direct Bridge to Machine Learning

The most direct path from bootstrapping to AI runs through Leo Breiman's 1996 **Bagging (Bootstrap AGGregatING)**. Breiman's idea is clear: create multiple training datasets via bootstrap, train a model on each, and combine predictions by averaging (regression) or voting (classification).

Why does this work? The key is **variance reduction**. By analogy, asking one expert for an economic forecast reflects that individual's biases. Asking 100 independent experts and averaging cancels individual biases, leaving something close to consensus. This is the "wisdom of crowds" -- and bagging's mathematical essence. The variance of n averaged models approaches 1/n of a single model's variance (the more independent the models).

In 2001, Breiman went further. **Random Forest** adds random feature selection to bagging. At each split in each decision tree, only a random subset of features is considered. If bootstrap creates diversity in training data, random feature selection creates diversity in tree structure. This double randomization reduces inter-tree correlation, achieving greater variance reduction than plain bagging.

Here the 36.8% property shines. **Out-of-Bag (OOB) evaluation**: the 36.8% of data left out of each bootstrap sample validates that model. Aggregating across all models estimates model performance without a separate validation set. When data is scarce, this property is especially valuable.

## Extensions in Modern AI

Bootstrapping's core principle -- "randomly select data subsets to create diversity" -- lives on in transformed forms throughout modern AI.

**Direct application of the statistical principle:**

- **Model ensembles**: Combining predictions from multiple neural networks improves accuracy and **estimates uncertainty**. If five networks agree, confidence is high; if they diverge widely, uncertainty is high. This is crucial in domains like medical diagnosis and autonomous driving where the system must be able to say "I don't know."
- **Subsampling in XGBoost and LightGBM**: Using random data subsets at each iteration is a direct variant of bootstrapping, simultaneously preventing overfitting and improving computational efficiency.

**Structural similarities sharing the same intuition:**

- **Dropout**: Gal & Ghahramani (2016) showed that randomly deactivating neurons during training can be interpreted as approximate Bayesian inference. It shares the principle of "repeatedly selecting random subsets," but was not historically inspired by bootstrapping.
- **Data augmentation**: Creating training data variations through image rotation, cropping, and color shifting is a spiritual relative of bootstrapping's idea of "creating more diversity from limited data" -- though technically an entirely different method.

## Limitations and Weaknesses

Despite its near-universal applicability, bootstrapping has clear limitations.

- **Dependence on sample representativeness**: If the original sample poorly represents the population, the bootstrap distribution is also biased. Resampling a biased survey 10,000 times does not remove the bias.
- **Unsuitable for extreme-value statistics**: Statistics depending on extremes, such as the maximum or minimum, are poorly approximated by resampling. The maximum of a virtual sample cannot exceed the original data's maximum.
- **Data dependencies**: For time series data with temporal ordering or correlation between observations, naive bootstrapping destroys this structure. Variants like block bootstrap that preserve dependencies are required.
- **Computational cost**: Generating virtual samples and computing statistics thousands of times demands significant computation. Without advances in computing power, practical adoption would have been difficult.

## Glossary

Bootstrapping - a method of empirically estimating the distribution of a statistic by repeatedly generating virtual samples through sampling with replacement from a single sample. Efron (1979)

Sampling with replacement - a sampling method where drawn data is returned before the next draw, allowing the same item to be selected multiple times

Confidence interval - the range of values expected to contain the true parameter value; e.g., a 95% confidence interval captures the true value in about 95 out of 100 repetitions

Bagging (bootstrap aggregating) - an ensemble technique that trains multiple models on bootstrap samples and combines predictions. Breiman (1996)

Random forest - a decision tree ensemble adding random feature selection to bagging; double randomization reduces inter-tree correlation to maximize variance reduction. Breiman (2001)

Out-of-Bag (OOB) - a technique that validates each model using the approximately 36.8% of data excluded from its bootstrap sample, eliminating the need for a separate validation set

Ensemble - the general strategy of combining predictions from multiple models to achieve performance superior to any single model

Variance reduction - the statistical principle that averaging multiple independent estimates reduces the fluctuation of each individual estimate
