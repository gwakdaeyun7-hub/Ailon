---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 베이즈 정리, 사후 확률, 사전 확률, 우도, 베이즈 신경망, 불확실성 정량화, 베이즈 최적화, 모델 평균화
keywords_en: Bayes theorem, posterior, prior, likelihood, Bayesian neural networks, uncertainty quantification, Bayesian optimization, model averaging
---
Bayesian Inference - 데이터로부터 믿음을 갱신하는 확률적 학습의 근본 프레임워크

## 역전 추론: 결과에서 원인으로

일상의 확률 추론은 원인에서 결과로 향한다. "이 주사위가 공정하다면, 6이 나올 확률은 1/6이다." 그런데 현실의 문제는 방향이 반대다. 주사위를 60번 던졌더니 6이 20번 나왔다. 이 주사위는 공정한가? 관찰된 **결과**로부터 숨겨진 **원인**(주사위의 편향 정도)을 추론해야 한다. 이것이 역확률(inverse probability) 문제이며, 베이즈 추론의 출발점이다.

영국 장로교 목사 Thomas Bayes(1701-1761)가 유고 논문 "An Essay towards solving a Problem in the Doctrine of Chances"(1763, 사후 출판)에서 이 역전을 처음 수학적으로 다뤘다. Bayes의 질문은 단순했다. 동전을 여러 번 던져 앞면의 비율을 관찰했을 때, 동전의 "진짜 앞면 확률"이 특정 범위에 있을 가능성은 얼마인가? Pierre-Simon Laplace(1812)가 이를 엄밀하게 일반화하면서 **베이즈 정리**는 확률론의 핵심 도구가 되었다. 20세기에 Harold Jeffreys(1939)가 비정보적 사전분포(non-informative prior)의 원리를 제안하여 "사전 지식이 전혀 없을 때도 베이즈 추론을 적용할 수 있다"는 실용적 기반을 마련했다.

## 베이즈 정리: 학습의 수학적 구조

베이즈 정리의 핵심 공식은 다음과 같다.

P(theta|D) = P(D|theta) * P(theta) / P(D)

각 항은 뚜렷한 역할을 맡는다.

- P(theta) = 사전 확률(prior). 데이터를 보기 전, 파라미터 theta에 대한 기존 믿음. 예를 들어 "이 동전은 아마 공정할 것이다"라는 판단
- P(D|theta) = 우도(likelihood). 파라미터가 theta일 때 실제로 관찰된 데이터 D가 나타날 확률. "앞면 확률이 0.5인 동전에서 20/60이 나올 확률은 얼마인가"
- P(D) = 증거(evidence) 또는 주변 우도(marginal likelihood). 가능한 모든 theta에 대해 우도와 사전 확률의 곱을 적분한 값. 전체를 1로 정규화하는 상수 역할
- P(theta|D) = 사후 확률(posterior). 데이터를 관찰한 뒤 갱신된 파라미터에 대한 새로운 믿음

비례 관계로 더 직관적으로 줄이면 이렇다.

사후 확률은 우도 곱하기 사전 확률에 비례한다: P(theta|D) ~ P(D|theta) * P(theta)

이 구조가 말하는 것은 명료하다. **학습이란 기존 믿음(사전 확률)을 새로운 증거(우도)로 갱신하여 새로운 믿음(사후 확률)을 얻는 과정이다.** 데이터가 1개일 때는 사전 확률이 사후 확률을 지배한다. 데이터가 100개, 1000개로 늘어나면 우도의 누적 효과가 사전 확률을 압도하여 사후 확률은 데이터가 가리키는 방향으로 수렴한다. 극단적으로 데이터가 무한히 많으면, 어떤 사전 확률에서 출발하든 사후 확률은 같은 곳에 모인다. 이 성질 덕분에 "주관적 출발점"이라는 비판에도 불구하고 베이즈 추론은 수학적으로 건전하다.

이를 공간적으로 상상하면 이렇다. 사전 확률은 넓은 언덕이다. 이 언덕 위에 데이터가 도착할 때마다 우도라는 조각상이 놓이고, 조각상들이 겹치는 지점에서 언덕의 봉우리가 점점 뾰족하게 솟아오른다. 그 봉우리가 사후 확률의 최빈값이다. 데이터가 쌓일수록 봉우리는 더 좁고 높아져서, 원래 언덕의 모양(사전 확률)은 거의 잊힌다.

## 통계학에서 AI로: 수학적 동일성의 다리

베이즈 추론이 AI에 미친 영향은 비유적 차용이 아니다. 수학적 구조가 그대로 이식된 직접적 영감이다. 핵심 대응 관계는 다음과 같다.

- 파라미터 theta --> **신경망 가중치 w** (추론 대상)
- 사전 확률 P(theta) --> **정규화(regularization)** (가중치에 대한 사전 믿음)
- 우도 P(D|theta) --> **학습 데이터에 대한 손실 함수** (데이터가 모델을 평가)
- 사후 확률 P(theta|D) --> **학습된 가중치 분포** (데이터 반영 후 모델의 상태)
- 사후 확률 갱신 --> **학습 루프** (새 배치마다 믿음 갱신)

이 대응에서 결정적 연결 하나가 있다. 신경망의 **가중치 감쇠**(weight decay) -- 손실 함수에 lambda * ||w||^2를 더하는 L2 정규화 -- 는 가중치에 **가우시안 사전분포** P(w) ~ exp(-lambda * ||w||^2)를 부여한 MAP 추정과 수학적으로 동치다. 이것은 우연의 일치가 아니다. 정규화가 "가중치가 극단적으로 커지는 것을 벌점으로 억제한다"는 엔지니어링 직관은, "가중치는 0 근처에 있을 것이라는 사전 믿음을 부여한다"는 베이즈 해석과 같은 것을 다른 언어로 표현한 것이다. L1 정규화(Lasso)는 라플라스 사전분포에 대응하며, 이 경우 가중치 중 상당수를 정확히 0으로 만들어 **희소성**(sparsity)을 유도한다.

## 점추정의 두 경로: MAP과 MLE

사후 확률 분포 전체를 구하는 것은 계산적으로 매우 비싸다. 그래서 분포 대신 하나의 "최선의 값"을 뽑는 두 가지 점추정 전략이 발전했다.

1. MAP(Maximum A Posteriori) 추정: theta_MAP = argmax [P(D|theta) * P(theta)]. 사후 확률이 가장 높은 지점을 찾는다. 사전 확률의 영향을 유지하므로, 데이터가 적을 때도 합리적 추정을 제공한다. 위에서 설명한 L2 정규화가 바로 MAP이다.

2. MLE(Maximum Likelihood Estimation): theta_MLE = argmax P(D|theta). 사전 확률을 무시하고(모든 theta가 동등하다는 균일 사전분포를 암묵적으로 가정하고) 우도만 최대화한다. 정규화 없는 신경망 학습이 이에 해당한다.

데이터가 충분히 많으면 MAP과 MLE는 수렴한다. 이는 위에서 설명한 "데이터가 사전 확률을 압도하는" 성질의 직접적 귀결이다.

## AI 응용: 베이즈 원리가 살아 있는 곳

**수학적 동일성에 기반한 직접적 영감:**

첫째, 베이즈 신경망(Bayesian Neural Networks). MacKay(1992)와 Neal(1996)은 신경망의 가중치를 고정된 값이 아니라 확률 분포로 취급할 것을 제안했다. 일반 신경망이 "이 이미지는 고양이다"라고 단정하는 반면, 베이즈 신경망은 "이 이미지가 고양이일 확률은 92%이고, 내 불확실성은 +-8%이다"라고 답한다. 예측 시 단일 가중치가 아닌 가중치 분포 전체에 대해 적분하여 예측 분포를 구하기 때문이다. 자율주행에서 보행자 감지의 신뢰도가 낮으면 감속하고, 의료 진단에서 불확실성이 높으면 추가 검사를 권고하는 것 -- 이런 안전 결정은 불확실성의 정량화 없이는 불가능하다.

둘째, MC-Dropout. Gal과 Ghahramani(2016)는 이미 널리 쓰이던 드롭아웃(Dropout)을 추론 시에도 여러 번 적용하면, 그 결과가 베이즈 신경망의 근사적 사후 추론과 수학적으로 동치라는 것을 보였다. 학습 때 뉴런을 무작위로 껐다 켜는 것은, 사실상 서로 다른 가중치 조합을 가진 여러 신경망을 동시에 학습하는 것과 같고, 추론 때 이를 반복 샘플링하면 가중치 사후 분포에서 표본을 추출하는 것이 된다. 기존 네트워크를 거의 수정하지 않고 불확실성을 추정할 수 있게 한 실용적 발견이다.

셋째, 베이즈 최적화(Bayesian Optimization). 신경망의 학습률, 레이어 수 같은 하이퍼파라미터를 탐색할 때 쓰인다. 가우시안 프로세스(GP)를 사전 확률로 사용하고, 실험 결과가 도착할 때마다 사후 확률을 갱신하며, 획득 함수(acquisition function)가 "다음에 어디를 탐색하면 가장 정보를 많이 얻을까"를 결정한다. 100가지 조합을 전부 시도하는 대신 10~20회 실험으로 좋은 하이퍼파라미터를 찾아내는 효율은, 베이즈 갱신이 각 실험에서 최대한의 정보를 뽑아내기 때문에 가능하다.

넷째, 모델 평균화(Model Averaging)와 앙상블. 베이즈 사후 예측 분포는 가능한 모든 모델에 대해 사후 확률로 가중평균한다. 단일 모델이 틀릴 수 있는 예측을 여러 모델의 의견 종합으로 보완하는 앙상블 학습의 이론적 정당화가 바로 여기에 있다.

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

- **LLM의 in-context learning**: 대형 언어모델이 프롬프트에 제시된 예시 몇 개로 새로운 과제를 수행하는 현상은, "소수의 새로운 증거로 기존 믿음을 빠르게 갱신하는" 베이즈 갱신과 구조적으로 유사하다. Xie et al.(2022)은 이 연결을 이론적으로 분석했다. 다만 트랜스포머 내부에서 베이즈 갱신이 실제로 일어나는지는 아직 열린 문제다.
- **온라인 학습(online learning)의 점진적 갱신**: 데이터가 하나씩 도착할 때마다 모델을 갱신하는 구조는 베이즈의 순차적 갱신과 같은 직관을 공유하지만, 빈도주의 온라인 학습은 독립적으로 발전한 전통이다.

## 계산적 장벽: 분모를 구할 수 없다

베이즈 추론의 가장 큰 실무적 장벽은 분모 P(D)의 계산이다. P(D) = integral P(D|theta) * P(theta) d(theta)에서 이 적분은 파라미터가 2~3개일 때는 풀 수 있지만, 현대 신경망처럼 파라미터가 수백만~수십억 개인 고차원 공간에서는 해석적으로 풀 수 없다.

이를 우회하는 두 가지 주요 전략이 발전했다.

MCMC(Markov Chain Monte Carlo). 사후 분포에서 직접 샘플을 추출한다. Neal(1996)이 신경망에 적용한 하이브리드 몬테카를로(HMC)가 대표적이다. 사후 분포의 확률이 높은 영역에서 표본이 집중적으로 뽑히도록 마르코프 체인을 설계하는 방법이다. 이론적으로 정확하지만, 체인이 사후 분포의 전체 지형을 충분히 탐색하려면 수렴 시간이 매우 길다. 파라미터가 수백만 개인 모델에는 적용하기 어렵다.

변분 추론(Variational Inference). 사후 분포 P(theta|D)를 직접 구하는 대신, 다루기 쉬운 단순한 분포 q(theta)(보통 가우시안)를 정하고, q가 진짜 사후 분포에 최대한 가까워지도록 KL divergence를 최소화한다. Blundell et al.(2015)의 Bayes by Backprop이 대표적이다. 정확도는 MCMC보다 떨어지지만, 역전파로 최적화할 수 있어 대규모 모델에도 적용 가능하다. 이 확장성 덕분에 현대 베이즈 딥러닝의 주류 접근법이 되었다.

## 사전 확률의 딜레마: 약점이자 강점

베이즈 추론에 대한 가장 근본적인 비판은 사전 확률의 주관성이다. "데이터를 보기 전의 믿음"을 누가 어떤 근거로 설정하는가? 이에 대해 Jeffreys(1939)의 비정보적 사전분포, 최대 엔트로피 사전분포, 경험적 베이즈(empirical Bayes -- 데이터의 일부로 사전분포를 추정하는 방법) 등 다양한 해법이 제안되었지만, 완전히 "객관적인" 사전분포는 존재하지 않는다.

그러나 이 약점은 AI에서 역설적으로 강점이 된다. 사전 확률은 도메인 지식을 모델에 명시적으로 주입하는 통로다. 의료 데이터가 100건밖에 없을 때, "약물 효과의 크기는 보통 작다"는 사전 지식을 가우시안 사전분포로 부여하면, 데이터의 우연적 패턴에 과적합하는 것을 막고 일반화 성능을 높인다. 정규화(regularization)가 바로 이 원리의 빈도주의적 번역이다.

## 한계와 약점

- **계산 비용**: 정확한 사후 추론은 대규모 모델에서 여전히 비실용적이다. MCMC는 너무 느리고, 변분 추론은 근사 오차를 수반한다. 이 때문에 현대 딥러닝의 주류는 점추정(SGD 기반 MLE/MAP)에 머물러 있다.
- **사전분포 민감성**: 데이터가 적을 때 사전분포 선택이 결과를 지배한다. 잘못된 사전분포는 편향된 추론을 낳고, 이 주관성은 객관적 방법론을 추구하는 과학적 맥락에서 지속적 논쟁거리다.
- **모델 비교의 한계**: 베이즈 인수(Bayes factor)를 이용한 모델 비교는 사전분포에 극도로 민감하다. 두 모델 중 어느 것이 더 나은지를 판별하는 데 사전분포의 선택이 결론을 뒤집을 수 있다는 것이 Lindley의 역설이 보여주는 문제다.
- **딥러닝과의 괴리**: 현대 심층 신경망이 사후 추론 없이도 뛰어난 성능을 보이는 이유는 아직 완전히 설명되지 않았다. 수십억 파라미터 모델에서 단순한 점추정(SGD)이 왜 과적합하지 않는가라는 질문에 베이즈 프레임워크는 아직 완전한 답을 제공하지 못한다.

## 용어 정리

사전 확률(prior) - 데이터를 관찰하기 전 파라미터에 대해 갖고 있는 기존 확률 분포

사후 확률(posterior) - 데이터를 관찰한 뒤 베이즈 정리를 통해 갱신된 파라미터의 확률 분포

우도(likelihood) - 특정 파라미터 값이 주어졌을 때 관찰된 데이터가 나타날 확률

주변 우도(marginal likelihood) - 모든 가능한 파라미터에 대해 우도를 적분한 값. 증거(evidence)라고도 부르며, 베이즈 정리의 분모 역할

MAP 추정(maximum a posteriori) - 사후 확률을 최대화하는 파라미터 값을 구하는 점추정 방법. L2 정규화된 신경망 학습과 수학적으로 동치

역확률(inverse probability) - 관찰된 결과로부터 원인의 확률을 추론하는 문제. 베이즈 추론의 역사적 출발점

가중치 감쇠(weight decay) - 신경망 학습에서 가중치의 크기에 비례하는 벌점을 손실 함수에 추가하는 정규화 기법

변분 추론(variational inference) - 다루기 어려운 사후 분포를 단순한 분포로 근사하고 KL divergence를 최소화하여 최적화하는 기법

비정보적 사전분포(non-informative prior) - 특정 파라미터 값을 선호하지 않도록 설계된 사전분포. Jeffreys prior가 대표적

획득 함수(acquisition function) - 베이즈 최적화에서 다음 탐색 지점을 결정하는 함수. Expected Improvement(EI)가 대표적

---EN---
Bayesian Inference - The fundamental probabilistic framework for learning from data by updating beliefs with evidence

## Inverse Reasoning: From Effects to Causes

Everyday probability reasoning runs from cause to effect. "If this die is fair, the probability of rolling a 6 is 1/6." But real-world problems reverse the direction. You rolled a die 60 times and got 6 twenty times. Is this die fair? You must infer the hidden **cause** (the die's bias) from the observed **effect**. This is the inverse probability problem, and the starting point of Bayesian inference.

The seed was planted by the English Presbyterian minister Thomas Bayes (1701-1761) in his posthumously published paper "An Essay towards solving a Problem in the Doctrine of Chances" (1763). Bayes posed a simple question: after flipping a coin many times and observing the proportion of heads, what is the probability that the coin's "true heads probability" falls within a certain range? Pierre-Simon Laplace (1812) rigorously generalized this, making **Bayes' theorem** a central tool in probability theory. In the 20th century, Harold Jeffreys (1939) proposed the principle of non-informative priors, establishing the practical foundation that "Bayesian reasoning can be applied even with no prior knowledge whatsoever."

## Bayes' Theorem: The Mathematical Structure of Learning

The core formula of Bayes' theorem is:

P(theta|D) = P(D|theta) * P(theta) / P(D)

Each term plays a distinct role:

- P(theta) = Prior. Existing belief about parameter theta before seeing data. For example, "this coin is probably fair"
- P(D|theta) = Likelihood. The probability of observing data D given parameter theta. "If the heads probability is 0.5, what is the chance of getting 20 out of 60?"
- P(D) = Evidence or marginal likelihood. The integral of the product of likelihood and prior over all possible theta values. Serves as a normalizing constant
- P(theta|D) = Posterior. Updated belief about theta after observing data

More intuitively, the proportional form:

Posterior is proportional to likelihood times prior: P(theta|D) ~ P(D|theta) * P(theta)

What this structure says is clear. **Learning is the process of updating existing beliefs (prior) with new evidence (likelihood) to obtain new beliefs (posterior).** When you have just 1 data point, the prior dominates the posterior. As data grows to 100, 1000 points, the cumulative effect of the likelihood overwhelms the prior, and the posterior converges toward where the data points. In the extreme, with infinite data, the posterior converges to the same place regardless of the starting prior. This property is why Bayesian inference remains mathematically sound despite the criticism of "subjective starting points."

To visualize this spatially: the prior is a broad hill. Each time data arrives, a likelihood sculpture is placed on top. Where the sculptures overlap, the hill's peak rises ever sharper. That peak is the posterior's mode. As data accumulates, the peak becomes narrower and taller until the original hill shape (the prior) is virtually forgotten.

## From Statistics to AI: A Bridge of Mathematical Identity

Bayesian inference's impact on AI is not metaphorical borrowing. It is direct inspiration based on mathematical identity. The key correspondences are:

- Parameter theta --> **neural network weights w** (the object of inference)
- Prior P(theta) --> **regularization** (prior belief about weights)
- Likelihood P(D|theta) --> **loss function over training data** (data evaluating the model)
- Posterior P(theta|D) --> **learned weight distribution** (model state after seeing data)
- Posterior updating --> **training loop** (beliefs updated with each batch)

One connection in this mapping is decisive. **Weight decay** in neural networks -- adding lambda * ||w||^2 to the loss function as L2 regularization -- is mathematically equivalent to MAP estimation with a **Gaussian prior** P(w) ~ exp(-lambda * ||w||^2). This is not coincidence. The engineering intuition that "regularization penalizes extremely large weights" and the Bayesian interpretation that "we impose a prior belief that weights should be near zero" express the same thing in different languages. L1 regularization (Lasso) corresponds to a Laplace prior, which drives many weights to exactly 0, inducing **sparsity**.

## Two Paths of Point Estimation: MAP and MLE

Computing the full posterior distribution is extremely expensive. So two point estimation strategies evolved that extract a single "best value" instead.

1. MAP (Maximum A Posteriori) estimation: theta_MAP = argmax [P(D|theta) * P(theta)]. Finds the point where the posterior is highest. By retaining the prior's influence, it provides reasonable estimates even with limited data. The L2 regularization described above is precisely MAP.

2. MLE (Maximum Likelihood Estimation): theta_MLE = argmax P(D|theta). Ignores the prior (implicitly assuming a uniform prior where all theta are equally likely) and maximizes only the likelihood. Neural network training without regularization corresponds to this.

With sufficient data, MAP and MLE converge. This is a direct consequence of the property described above: data overwhelms the prior.

## AI Applications: Where the Bayesian Principle Lives

**Direct inspiration based on mathematical identity:**

First, Bayesian Neural Networks. MacKay (1992) and Neal (1996) proposed treating neural network weights not as fixed values but as probability distributions. While a standard network declares "this image is a cat," a Bayesian network says "this image is a cat with 92% probability, and my uncertainty is +-8%." This is because prediction integrates over the entire weight distribution rather than using a single weight. In autonomous driving, if pedestrian detection confidence is low, the system decelerates. In medical diagnosis, if uncertainty is high, additional tests are recommended. Such safety decisions are impossible without quantified uncertainty.

Second, MC-Dropout. Gal and Ghahramani (2016) showed that applying the already widely-used Dropout at inference time multiple times is mathematically equivalent to approximate posterior inference in a Bayesian neural network. Randomly switching neurons off during training is effectively training multiple networks with different weight configurations simultaneously, and repeatedly sampling during inference amounts to drawing samples from the weight posterior distribution. A practical discovery that enables uncertainty estimation with minimal modifications to existing networks.

Third, Bayesian Optimization. Used to search hyperparameters like learning rate and layer count in neural networks. A Gaussian Process (GP) serves as the prior, each experimental result updates the posterior, and an acquisition function determines "where should I search next to gain the most information?" Instead of trying all 100 combinations, finding good hyperparameters in just 10-20 experiments is possible because Bayesian updating extracts maximum information from each trial.

Fourth, Model Averaging and ensembles. The Bayesian posterior predictive distribution is a weighted average over all possible models using posterior probabilities. Ensemble learning -- compensating for predictions where a single model might err by synthesizing opinions from multiple models -- finds its theoretical justification here.

**Structural similarities sharing the same intuition independently:**

- **In-context learning in LLMs**: The phenomenon where large language models perform new tasks from just a few prompt examples is structurally similar to Bayesian updating -- "rapidly updating existing beliefs from a small number of new evidence." Xie et al. (2022) analyzed this connection theoretically. However, whether Bayesian updating actually occurs inside transformer computations remains an open question.
- **Incremental updating in online learning**: The structure of updating a model each time a new data point arrives shares the same intuition as Bayesian sequential updating, but frequentist online learning developed as an independent tradition.

## Computational Barrier: The Denominator Is Intractable

The greatest practical barrier in Bayesian inference is computing the denominator P(D). In P(D) = integral P(D|theta) * P(theta) d(theta), this integral is solvable when there are 2-3 parameters, but becomes analytically intractable in the high-dimensional parameter spaces of modern neural networks (millions to billions of dimensions).

Two major strategies have been developed to circumvent this.

MCMC (Markov Chain Monte Carlo). Draws samples directly from the posterior distribution. Hybrid Monte Carlo (HMC), applied to neural networks by Neal (1996), is the prime example. It designs a Markov chain so that samples concentrate in high-probability regions of the posterior. Theoretically exact, but convergence time is very long as the chain must sufficiently explore the posterior's full landscape. Impractical for models with millions of parameters.

Variational Inference. Instead of computing P(theta|D) directly, it specifies a tractable simple distribution q(theta) (typically Gaussian) and minimizes the KL divergence so that q approximates the true posterior as closely as possible. Bayes by Backprop (Blundell et al. 2015) is the prime example. Less accurate than MCMC but optimizable via backpropagation, making it applicable to large-scale models. This scalability has made it the mainstream approach in modern Bayesian deep learning.

## The Prior Dilemma: Weakness and Strength

The most fundamental criticism of Bayesian inference is the subjectivity of the prior. Who sets "beliefs before seeing data," and on what basis? Various solutions have been proposed -- Jeffreys' (1939) non-informative priors, maximum entropy priors, and empirical Bayes (which estimates the prior from part of the data itself) -- but a completely "objective" prior does not exist.

Yet this weakness paradoxically becomes a strength in AI. The prior is an explicit channel for injecting domain knowledge into models. When medical data amounts to only 100 cases, encoding the prior knowledge that "drug effect sizes are typically small" as a Gaussian prior prevents overfitting to accidental patterns in the data and improves generalization. Regularization is precisely the frequentist translation of this principle.

## Limitations and Weaknesses

- **Computational cost**: Exact posterior inference remains impractical for large models. MCMC is too slow; variational inference introduces approximation error. This is why mainstream modern deep learning remains at point estimation (SGD-based MLE/MAP).
- **Prior sensitivity**: When data is scarce, the choice of prior dominates results. A poorly chosen prior produces biased inference, and this subjectivity remains a persistent point of debate in scientific contexts pursuing objectivity.
- **Model comparison limitations**: Bayesian model comparison via Bayes factors is extremely sensitive to prior specification. The choice of prior can reverse conclusions about which of two models is better -- this is the problem Lindley's paradox sharply illustrates.
- **Gap with deep learning**: Why modern deep neural networks achieve excellent performance without posterior inference is not yet fully explained. The question of why simple point estimation (SGD) in models with billions of parameters does not overfit has not yet received a complete answer from the Bayesian framework.

## Glossary

Prior - the probability distribution representing existing beliefs about a parameter before observing any data

Posterior - the updated probability distribution of a parameter after applying Bayes' theorem to observed data

Likelihood - the probability of observing the data given a specific parameter value

Marginal likelihood - the integral of the likelihood over all possible parameter values; also called evidence, serving as the denominator in Bayes' theorem

MAP estimation (maximum a posteriori) - a point estimation method that finds the parameter value maximizing the posterior probability; mathematically equivalent to L2-regularized neural network training

Inverse probability - the problem of inferring the probability of a cause from observed effects; the historical starting point of Bayesian inference

Weight decay - a regularization technique in neural network training that adds a penalty proportional to weight magnitude to the loss function

Variational inference - a technique for approximating an intractable posterior distribution with a simpler distribution by minimizing the KL divergence

Non-informative prior - a prior designed not to favor any particular parameter value; Jeffreys prior is the most representative example

Acquisition function - a function in Bayesian optimization that determines the next exploration point; Expected Improvement (EI) is the most common
