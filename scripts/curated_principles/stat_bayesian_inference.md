---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 베이즈 정리, 사후 확률, 사전 확률, 우도, 베이즈 신경망, 불확실성 정량화, 베이즈 최적화, 모델 평균화
keywords_en: Bayes theorem, posterior, prior, likelihood, Bayesian neural networks, uncertainty quantification, Bayesian optimization, model averaging
---
Bayesian Inference - 데이터로부터 믿음을 갱신하는 확률적 학습의 근본 프레임워크

## 역전 추론: 결과에서 원인으로

일상의 확률 추론은 원인에서 결과로 향한다. "이 주사위가 공정하다면, 6이 나올 확률은 1/6이다." 그런데 현실의 문제는 방향이 반대다. 주사위를 60번 던졌더니 6이 20번 나왔다. 이 주사위는 공정한가? 관찰된 **결과**로부터 숨겨진 **원인**(주사위의 편향 정도)을 추론해야 한다. 이것이 역확률(inverse probability) 문제이며, 베이즈 추론의 출발점이다.

Thomas Bayes(1701-1761)가 유고 논문(1763)에서 이 역전을 처음 수학적으로 다뤘다. Pierre-Simon Laplace(1812)가 이를 엄밀하게 일반화하면서 **베이즈 정리**는 확률론의 핵심 도구가 되었다. 20세기에 Harold Jeffreys(1939)가 비정보적 사전분포(non-informative prior)를 제안하여 "사전 지식이 없을 때도 베이즈 추론을 적용할 수 있다"는 실용적 기반을 마련했다.

## 베이즈 정리: 학습의 수학적 구조

베이즈 정리의 핵심 공식은 다음과 같다.

P(theta|D) = P(D|theta) * P(theta) / P(D)

각 항은 뚜렷한 역할을 맡는다.

- P(theta) = 사전 확률(prior). 데이터를 보기 전, 파라미터 theta에 대한 기존 믿음
- P(D|theta) = 우도(likelihood). 파라미터가 theta일 때 관찰된 데이터 D가 나타날 확률
- P(D) = 증거(evidence) 또는 주변 우도(marginal likelihood). 전체를 1로 정규화하는 상수
- P(theta|D) = 사후 확률(posterior). 데이터를 관찰한 뒤 갱신된 새로운 믿음

비례 관계로 줄이면 이렇다.

사후 확률은 우도 곱하기 사전 확률에 비례한다: P(theta|D) ~ P(D|theta) * P(theta)

이 구조가 말하는 것은 명료하다. **학습이란 기존 믿음(사전 확률)을 새로운 증거(우도)로 갱신하여 새로운 믿음(사후 확률)을 얻는 과정이다.** 데이터가 1개일 때는 사전 확률이 지배하지만, 데이터가 늘어나면 우도의 누적 효과가 사전 확률을 압도하여 사후 확률은 데이터가 가리키는 방향으로 수렴한다. 극단적으로 데이터가 무한히 많으면, 어떤 사전 확률에서 출발하든 사후 확률은 같은 곳에 모인다.

이를 공간적으로 상상하면 이렇다. 사전 확률은 넓은 언덕이다. 데이터가 도착할 때마다 우도라는 조각상이 놓이고, 조각상들이 겹치는 지점에서 봉우리가 점점 뾰족하게 솟아오른다. 데이터가 쌓일수록 봉우리는 더 좁고 높아져서, 원래 언덕의 모양(사전 확률)은 거의 잊힌다.

## 통계학에서 AI로: 수학적 동일성의 다리

베이즈 추론이 AI에 미친 영향은 비유적 차용이 아니라, 수학적 구조가 그대로 이식된 직접적 영감이다. 핵심 대응 관계는 다음과 같다.

- 파라미터 theta --> **신경망 가중치 w** (추론 대상)
- 사전 확률 P(theta) --> **정규화(regularization)** (가중치에 대한 사전 믿음)
- 우도 P(D|theta) --> **학습 데이터에 대한 손실 함수**
- 사후 확률 P(theta|D) --> **학습된 가중치 분포**
- 사후 확률 갱신 --> **학습 루프** (새 배치마다 믿음 갱신)

결정적 연결 하나가 있다. 신경망의 **가중치 감쇠**(weight decay) -- 손실 함수에 lambda * ||w||^2를 더하는 L2 정규화 -- 는 가중치에 **가우시안 사전분포** P(w) ~ exp(-lambda * ||w||^2)를 부여한 MAP 추정과 수학적으로 동치다. 정규화가 "가중치가 극단적으로 커지는 것을 억제한다"는 엔지니어링 직관은, "가중치는 0 근처에 있을 것이라는 사전 믿음을 부여한다"는 베이즈 해석과 같은 것을 다른 언어로 표현한 것이다. L1 정규화(Lasso)는 라플라스 사전분포에 대응하며, 가중치 중 상당수를 정확히 0으로 만들어 **희소성**(sparsity)을 유도한다.

## 점추정의 두 경로: MAP과 MLE

사후 확률 분포 전체를 구하는 것은 계산적으로 매우 비싸다. 그래서 하나의 "최선의 값"을 뽑는 두 가지 점추정 전략이 발전했다.

1. MAP(Maximum A Posteriori) 추정: theta_MAP = argmax [P(D|theta) * P(theta)]. 사후 확률이 가장 높은 지점을 찾는다. 사전 확률의 영향을 유지하므로 데이터가 적을 때도 합리적 추정을 제공한다. L2 정규화가 바로 MAP이다.

2. MLE(Maximum Likelihood Estimation): theta_MLE = argmax P(D|theta). 사전 확률을 무시하고 우도만 최대화한다. 정규화 없는 신경망 학습이 이에 해당한다.

데이터가 충분히 많으면 MAP과 MLE는 수렴한다.

## AI 응용: 베이즈 원리가 살아 있는 곳

**수학적 동일성에 기반한 직접적 영감:**

- **베이즈 신경망(BNN)**: MacKay(1992)와 Neal(1996)은 가중치를 고정 값이 아닌 확률 분포로 취급할 것을 제안했다. 예측 시 가중치 분포 전체에 대해 적분하므로 "이 이미지가 고양이일 확률 92%, 불확실성 +-8%"처럼 불확실성을 정량화한다. 자율주행 보행자 감지, 의료 진단 등 안전 결정에 필수적이다.
- **MC-Dropout**: Gal과 Ghahramani(2016)는 드롭아웃을 추론 시에도 반복 적용하면 베이즈 신경망의 근사적 사후 추론과 수학적으로 동치임을 보였다. 기존 네트워크를 거의 수정하지 않고 불확실성을 추정할 수 있는 실용적 발견이다.
- **베이즈 최적화**: 하이퍼파라미터 탐색에 사용된다. 가우시안 프로세스(GP)를 사전 확률로 사용하고, 실험 결과마다 사후 확률을 갱신하며, 획득 함수가 다음 탐색 지점을 결정한다. 100가지 조합 대신 10~20회 실험으로 좋은 결과를 찾아내는 효율은 베이즈 갱신 덕분이다.
- **모델 평균화와 앙상블**: 베이즈 사후 예측 분포는 모든 모델에 대해 사후 확률로 가중평균한다. 앙상블 학습의 이론적 정당화가 바로 여기에 있다.

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **LLM의 in-context learning**: 프롬프트의 예시 몇 개로 새 과제를 수행하는 현상은 "소수의 증거로 기존 믿음을 빠르게 갱신하는" 베이즈 갱신과 구조적으로 유사하다(Xie et al., 2022). 다만 트랜스포머 내부에서 실제로 베이즈 갱신이 일어나는지는 열린 문제다.
- **온라인 학습의 점진적 갱신**: 데이터가 하나씩 도착할 때마다 모델을 갱신하는 구조는 베이즈의 순차적 갱신과 같은 직관을 공유하지만 독립적으로 발전한 전통이다.

## 계산적 장벽과 우회 전략

베이즈 추론의 가장 큰 실무적 장벽은 분모 P(D)의 계산이다. 파라미터가 수백만~수십억 개인 고차원 공간에서는 적분이 해석적으로 풀 수 없다. 두 가지 주요 우회 전략이 발전했다.

MCMC는 사후 분포에서 직접 샘플을 추출한다. 이론적으로 정확하지만, 수렴 시간이 길어 대규모 모델에는 적용하기 어렵다. 변분 추론은 다루기 쉬운 분포 q(theta)를 정하고 진짜 사후 분포에 가까워지도록 KL divergence를 최소화한다. 정확도는 떨어지지만 역전파로 최적화할 수 있어 대규모 모델에도 적용 가능하며, 현대 베이즈 딥러닝의 주류 접근법이 되었다.

## 한계와 약점

- **계산 비용**: 정확한 사후 추론은 대규모 모델에서 여전히 비실용적이다. 이 때문에 현대 딥러닝의 주류는 점추정(SGD 기반 MLE/MAP)에 머물러 있다.
- **사전분포 민감성**: 데이터가 적을 때 사전분포 선택이 결과를 지배한다. 잘못된 사전분포는 편향된 추론을 낳으며, 이 주관성은 지속적 논쟁거리다.
- **모델 비교의 한계**: 베이즈 인수(Bayes factor)를 이용한 모델 비교는 사전분포에 극도로 민감하다(Lindley의 역설).
- **딥러닝과의 괴리**: 수십억 파라미터 모델에서 단순한 점추정(SGD)이 왜 과적합하지 않는가라는 질문에 베이즈 프레임워크는 아직 완전한 답을 제공하지 못한다.

## 용어 정리

사전 확률(prior) - 데이터를 관찰하기 전 파라미터에 대해 갖고 있는 기존 확률 분포

사후 확률(posterior) - 데이터를 관찰한 뒤 베이즈 정리를 통해 갱신된 파라미터의 확률 분포

우도(likelihood) - 특정 파라미터 값이 주어졌을 때 관찰된 데이터가 나타날 확률

MAP 추정(maximum a posteriori) - 사후 확률을 최대화하는 파라미터 값을 구하는 점추정 방법. L2 정규화된 신경망 학습과 수학적으로 동치

역확률(inverse probability) - 관찰된 결과로부터 원인의 확률을 추론하는 문제. 베이즈 추론의 역사적 출발점

가중치 감쇠(weight decay) - 신경망 학습에서 가중치의 크기에 비례하는 벌점을 손실 함수에 추가하는 정규화 기법

변분 추론(variational inference) - 다루기 어려운 사후 분포를 단순한 분포로 근사하고 KL divergence를 최소화하여 최적화하는 기법

획득 함수(acquisition function) - 베이즈 최적화에서 다음 탐색 지점을 결정하는 함수. Expected Improvement(EI)가 대표적

---EN---
Bayesian Inference - The fundamental probabilistic framework for learning from data by updating beliefs with evidence

## Inverse Reasoning: From Effects to Causes

Everyday probability reasoning runs from cause to effect. "If this die is fair, the probability of rolling a 6 is 1/6." But real-world problems reverse the direction. You rolled a die 60 times and got 6 twenty times. Is this die fair? You must infer the hidden **cause** (the die's bias) from the observed **effect**. This is the inverse probability problem, and the starting point of Bayesian inference.

Thomas Bayes (1701-1761) first addressed this inversion mathematically in his posthumous paper (1763). Pierre-Simon Laplace (1812) rigorously generalized it, making **Bayes' theorem** a central tool in probability theory. In the 20th century, Harold Jeffreys (1939) proposed non-informative priors, establishing the practical foundation that "Bayesian reasoning can be applied even with no prior knowledge."

## Bayes' Theorem: The Mathematical Structure of Learning

The core formula of Bayes' theorem is:

P(theta|D) = P(D|theta) * P(theta) / P(D)

Each term plays a distinct role:

- P(theta) = Prior. Existing belief about parameter theta before seeing data
- P(D|theta) = Likelihood. The probability of observing data D given parameter theta
- P(D) = Evidence or marginal likelihood. A normalizing constant
- P(theta|D) = Posterior. Updated belief about theta after observing data

More intuitively:

Posterior is proportional to likelihood times prior: P(theta|D) ~ P(D|theta) * P(theta)

What this structure says is clear. **Learning is the process of updating existing beliefs (prior) with new evidence (likelihood) to obtain new beliefs (posterior).** When you have just 1 data point, the prior dominates. As data grows, the cumulative effect of the likelihood overwhelms the prior, and the posterior converges toward where the data points. With infinite data, the posterior converges to the same place regardless of the starting prior.

To visualize spatially: the prior is a broad hill. Each time data arrives, a likelihood sculpture is placed on top. Where the sculptures overlap, the peak rises ever sharper. As data accumulates, the peak becomes narrower and taller until the original hill shape (the prior) is virtually forgotten.

## From Statistics to AI: A Bridge of Mathematical Identity

Bayesian inference's impact on AI is not metaphorical borrowing -- it is direct inspiration where mathematical structure was transplanted intact. The key correspondences are:

- Parameter theta --> **neural network weights w** (the object of inference)
- Prior P(theta) --> **regularization** (prior belief about weights)
- Likelihood P(D|theta) --> **loss function over training data**
- Posterior P(theta|D) --> **learned weight distribution**
- Posterior updating --> **training loop** (beliefs updated with each batch)

One connection is decisive. **Weight decay** -- adding lambda * ||w||^2 as L2 regularization -- is mathematically equivalent to MAP estimation with a **Gaussian prior** P(w) ~ exp(-lambda * ||w||^2). The engineering intuition that "regularization penalizes large weights" and the Bayesian interpretation that "we impose a prior belief that weights should be near zero" express the same thing in different languages. L1 regularization (Lasso) corresponds to a Laplace prior, driving many weights to exactly 0 and inducing **sparsity**.

## Two Paths of Point Estimation: MAP and MLE

Computing the full posterior is extremely expensive. So two point estimation strategies evolved.

1. MAP (Maximum A Posteriori): theta_MAP = argmax [P(D|theta) * P(theta)]. Finds the posterior's peak. Retains the prior's influence, providing reasonable estimates even with limited data. L2 regularization is precisely MAP.

2. MLE (Maximum Likelihood Estimation): theta_MLE = argmax P(D|theta). Ignores the prior and maximizes only the likelihood. Neural network training without regularization corresponds to this.

With sufficient data, MAP and MLE converge.

## AI Applications: Where the Bayesian Principle Lives

**Direct inspiration based on mathematical identity:**

- **Bayesian Neural Networks (BNN)**: MacKay (1992) and Neal (1996) proposed treating weights as probability distributions rather than fixed values. By integrating over the entire weight distribution, BNNs quantify uncertainty -- "92% cat, +-8% uncertainty." Essential for safety-critical decisions in autonomous driving and medical diagnosis.
- **MC-Dropout**: Gal and Ghahramani (2016) showed that applying Dropout at inference time multiple times is mathematically equivalent to approximate Bayesian posterior inference. A practical discovery enabling uncertainty estimation with minimal modifications to existing networks.
- **Bayesian Optimization**: Used for hyperparameter search. A Gaussian Process (GP) serves as the prior, each result updates the posterior, and an acquisition function determines the next search point. Finding good results in 10-20 experiments instead of 100 is possible thanks to Bayesian updating.
- **Model Averaging and ensembles**: The Bayesian posterior predictive distribution is a weighted average over all models. Ensemble learning finds its theoretical justification here.

**Structural similarities sharing the same intuition independently:**

- **In-context learning in LLMs**: Performing new tasks from a few prompt examples is structurally similar to Bayesian updating (Xie et al., 2022). Whether Bayesian updating actually occurs inside transformers remains an open question.
- **Online learning**: Updating a model with each new data point shares the same intuition as Bayesian sequential updating but developed independently.

## Computational Barriers and Workarounds

The greatest practical barrier is computing the denominator P(D). In high-dimensional parameter spaces (millions to billions), this integral is analytically intractable. Two major workarounds have been developed.

MCMC draws samples directly from the posterior. Theoretically exact but too slow for large models. Variational inference specifies a tractable distribution q(theta) and minimizes KL divergence to approximate the true posterior. Less accurate but optimizable via backpropagation and applicable to large models, making it the mainstream approach in modern Bayesian deep learning.

## Limitations and Weaknesses

- **Computational cost**: Exact posterior inference remains impractical for large models. This is why mainstream deep learning stays at point estimation (SGD-based MLE/MAP).
- **Prior sensitivity**: When data is scarce, the prior dominates results. A poorly chosen prior produces biased inference.
- **Model comparison limitations**: Bayes factors are extremely sensitive to prior specification (Lindley's paradox).
- **Gap with deep learning**: Why simple point estimation (SGD) in billion-parameter models does not overfit has not received a complete answer from the Bayesian framework.

## Glossary

Prior - the probability distribution representing existing beliefs about a parameter before observing any data

Posterior - the updated probability distribution of a parameter after applying Bayes' theorem to observed data

Likelihood - the probability of observing the data given a specific parameter value

MAP estimation (maximum a posteriori) - a point estimation method that finds the parameter value maximizing the posterior; mathematically equivalent to L2-regularized training

Inverse probability - the problem of inferring the probability of a cause from observed effects; the historical starting point of Bayesian inference

Weight decay - a regularization technique adding a penalty proportional to weight magnitude to the loss function

Variational inference - approximating an intractable posterior with a simpler distribution by minimizing KL divergence

Acquisition function - a function in Bayesian optimization that determines the next exploration point; Expected Improvement (EI) is the most common
